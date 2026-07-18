# Module 5: XMost Smart Advisor

## Description
AI-powered system analysis dengan Gemini/Groq API untuk memberikan rekomendasi optimasi berbasis metrik real-time.

## Dependencies
- **External Crates**: `reqwest`, `serde_json`, `tokio`
- **Internal Modules**: All modules (metrics aggregation)
- **External APIs**: Google Gemini API / Groq API

## Core Features

### 1. Metrics Collector
**Purpose**: Aggregate snapshot dari semua module untuk dikirim ke AI

**Data Schema**:
```rust
// src-tauri/src/modules/smart_advisor/metrics_collector.rs
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemSnapshot {
    pub timestamp: u64,
    pub hardware: HardwareMetrics,
    pub memory: MemoryMetrics,
    pub cpu: CpuMetrics,
    pub gpu: GpuMetrics,
    pub user_context: UserContext,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HardwareMetrics {
    pub cpu_name: String,
    pub cpu_cores: u32,
    pub cpu_threads: u32,
    pub total_ram_gb: u32,
    pub gpu_name: String,
    pub gpu_vram_gb: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MemoryMetrics {
    pub total_mb: u64,
    pub used_mb: u64,
    pub standby_mb: u64,
    pub usage_percent: f32,
    pub last_purge_time: Option<u64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CpuMetrics {
    pub temperature_celsius: Option<f32>,
    pub active_power_plan: String,
    pub running_processes_count: u32,
    pub cpu_usage_percent: f32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GpuMetrics {
    pub vendor: String,
    pub temperature_celsius: Option<f32>,
    pub current_clocks_mhz: Option<(u32, u32)>, // (gpu, memory)
    pub hags_enabled: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserContext {
    pub primary_use_case: String, // "gaming", "productivity", "streaming", "mixed"
    pub target_apps: Vec<String>, // ["game.exe", "obs64.exe"]
}

pub struct MetricsCollector;

impl MetricsCollector {
    pub async fn collect_snapshot(user_context: UserContext) -> Result<SystemSnapshot, String> {
        // Aggregate dari semua modules
        let hw_info = crate::modules::dashboard::get_hardware_info()
            .map_err(|e| e.to_string())?;
        let mem_stats = crate::modules::dashboard::get_memory_stats()
            .map_err(|e| e.to_string())?;
        let temps = crate::modules::dashboard::get_temperatures()
            .map_err(|e| e.to_string())?;
        
        let power_plan = crate::modules::windows_tweaker::PowerPlanManager::get_active_plan()
            .unwrap_or_default();
        
        let gpu_vendor = crate::modules::gpu_bridge::GpuDetector::detect_vendor()
            .unwrap_or(crate::modules::gpu_bridge::GpuVendor::Unknown);
        let hags = crate::modules::gpu_bridge::HagsManager::get_hags_state()
            .unwrap_or(false);

        Ok(SystemSnapshot {
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            hardware: HardwareMetrics {
                cpu_name: hw_info.cpu_name,
                cpu_cores: hw_info.cpu_cores,
                cpu_threads: hw_info.cpu_threads,
                total_ram_gb: (mem_stats.total_mb / 1024) as u32,
                gpu_name: hw_info.gpu_name,
                gpu_vram_gb: (hw_info.gpu_vram_mb / 1024) as u32,
            },
            memory: MemoryMetrics {
                total_mb: mem_stats.total_mb,
                used_mb: mem_stats.used_mb,
                standby_mb: mem_stats.standby_mb,
                usage_percent: mem_stats.usage_percent,
                last_purge_time: None, // TODO: track dari MemoryPurger
            },
            cpu: CpuMetrics {
                temperature_celsius: temps.cpu_temp_celsius,
                active_power_plan: power_plan,
                running_processes_count: 0, // TODO: enumerate processes
                cpu_usage_percent: 0.0, // TODO: query current CPU usage
            },
            gpu: GpuMetrics {
                vendor: format!("{:?}", gpu_vendor),
                temperature_celsius: temps.gpu_temp_celsius,
                current_clocks_mhz: None, // TODO: query dari GPU module
                hags_enabled: hags,
            },
            user_context,
        })
    }
}
```

### 2. AI Client (Gemini/Groq)
**Purpose**: Send snapshot ke AI API dan receive structured recommendations

**API Selection**:
- **Primary**: Google Gemini API (gemini-pro)
- **Fallback**: Groq API (mixtral-8x7b-32768)

**Rust Implementation**:
```rust
// src-tauri/src/modules/smart_advisor/ai_client.rs
use reqwest::Client;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
struct GeminiRequest {
    contents: Vec<Content>,
}

#[derive(Debug, Serialize)]
struct Content {
    parts: Vec<Part>,
}

#[derive(Debug, Serialize)]
struct Part {
    text: String,
}

#[derive(Debug, Deserialize)]
struct GeminiResponse {
    candidates: Vec<Candidate>,
}

#[derive(Debug, Deserialize)]
struct Candidate {
    content: ContentResponse,
}

#[derive(Debug, Deserialize)]
struct ContentResponse {
    parts: Vec<PartResponse>,
}

#[derive(Debug, Deserialize)]
struct PartResponse {
    text: String,
}

pub struct AiClient {
    api_key: String,
    api_provider: String, // "gemini" or "groq"
    client: Client,
}

impl AiClient {
    pub fn new(api_key: String, api_provider: String) -> Self {
        Self {
            api_key,
            api_provider,
            client: Client::new(),
        }
    }

    pub async fn get_recommendations(&self, snapshot: &SystemSnapshot) -> Result<String, String> {
        match self.api_provider.as_str() {
            "gemini" => self.call_gemini(snapshot).await,
            "groq" => self.call_groq(snapshot).await,
            _ => Err("Invalid API provider".to_string()),
        }
    }

    async fn call_gemini(&self, snapshot: &SystemSnapshot) -> Result<String, String> {
        let url = format!(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={}",
            self.api_key
        );

        let prompt = self.build_prompt(snapshot);

        let request_body = GeminiRequest {
            contents: vec![Content {
                parts: vec![Part { text: prompt }],
            }],
        };

        let response = self
            .client
            .post(&url)
            .json(&request_body)
            .send()
            .await
            .map_err(|e| format!("API request failed: {}", e))?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(format!("API error: {}", error_text));
        }

        let gemini_response: GeminiResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        let recommendation = gemini_response
            .candidates
            .get(0)
            .and_then(|c| c.content.parts.get(0))
            .map(|p| p.text.clone())
            .ok_or("No recommendation in response")?;

        Ok(recommendation)
    }

    async fn call_groq(&self, snapshot: &SystemSnapshot) -> Result<String, String> {
        // Groq uses OpenAI-compatible API
        let url = "https://api.groq.com/openai/v1/chat/completions";

        let prompt = self.build_prompt(snapshot);

        let request_body = serde_json::json!({
            "model": "mixtral-8x7b-32768",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a Windows system optimization expert. Analyze the provided system metrics and provide actionable recommendations."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.7,
            "max_tokens": 1000,
        });

        let response = self
            .client
            .post(url)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .json(&request_body)
            .send()
            .await
            .map_err(|e| format!("API request failed: {}", e))?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(format!("API error: {}", error_text));
        }

        let groq_response: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        let recommendation = groq_response["choices"][0]["message"]["content"]
            .as_str()
            .ok_or("No recommendation in response")?
            .to_string();

        Ok(recommendation)
    }

    fn build_prompt(&self, snapshot: &SystemSnapshot) -> String {
        format!(
            r#"Analyze this Windows system and provide optimization recommendations in JSON format:

SYSTEM SNAPSHOT:
{}

Provide response as JSON with this structure:
{{
  "summary": "Brief 1-sentence summary",
  "recommendations": [
    {{
      "category": "Memory|CPU|GPU|Storage",
      "priority": "High|Medium|Low",
      "title": "Short title",
      "description": "Detailed explanation",
      "action": "Specific action user can take"
    }}
  ],
  "performance_score": 0-100
}}

Focus on actionable recommendations based on the data provided."#,
            serde_json::to_string_pretty(snapshot).unwrap()
        )
    }
}
```


### 3. Recommendation Parser
**Purpose**: Parse AI response JSON ke structured format untuk UI

**Rust Implementation**:
```rust
// src-tauri/src/modules/smart_advisor/recommendation_parser.rs
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdvisorResponse {
    pub summary: String,
    pub recommendations: Vec<Recommendation>,
    pub performance_score: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Recommendation {
    pub category: String,
    pub priority: Priority,
    pub title: String,
    pub description: String,
    pub action: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Priority {
    High,
    Medium,
    Low,
}

pub struct RecommendationParser;

impl RecommendationParser {
    pub fn parse(ai_response: &str) -> Result<AdvisorResponse, String> {
        // Try parse as JSON first
        if let Ok(response) = serde_json::from_str::<AdvisorResponse>(ai_response) {
            return Ok(response);
        }

        // Fallback: Extract JSON from markdown code block
        if let Some(json_start) = ai_response.find("```json") {
            if let Some(json_end) = ai_response[json_start..].find("```") {
                let json_content = &ai_response[json_start + 7..json_start + json_end];
                if let Ok(response) = serde_json::from_str::<AdvisorResponse>(json_content.trim()) {
                    return Ok(response);
                }
            }
        }

        // Fallback: Extract JSON block without markdown
        if let Some(json_start) = ai_response.find('{') {
            if let Some(json_end) = ai_response.rfind('}') {
                let json_content = &ai_response[json_start..=json_end];
                if let Ok(response) = serde_json::from_str::<AdvisorResponse>(json_content) {
                    return Ok(response);
                }
            }
        }

        // Last resort: Return raw text as single recommendation
        Ok(AdvisorResponse {
            summary: "AI analysis completed".to_string(),
            recommendations: vec![Recommendation {
                category: "General".to_string(),
                priority: Priority::Medium,
                title: "System Analysis".to_string(),
                description: ai_response.to_string(),
                action: "Review the AI recommendations above".to_string(),
            }],
            performance_score: 50,
        })
    }

    pub fn validate(response: &AdvisorResponse) -> Result<(), String> {
        if response.recommendations.is_empty() {
            return Err("No recommendations provided".to_string());
        }

        if response.performance_score > 100 {
            return Err("Invalid performance score".to_string());
        }

        for rec in &response.recommendations {
            if rec.title.is_empty() || rec.description.is_empty() {
                return Err("Invalid recommendation format".to_string());
            }
        }

        Ok(())
    }
}
```

## Tauri Commands
```rust
// src-tauri/src/modules/smart_advisor/mod.rs

#[tauri::command]
pub async fn get_smart_recommendations(
    use_case: String,
    target_apps: Vec<String>,
) -> Result<AdvisorResponse, String> {
    // 1. Collect metrics snapshot
    let user_context = UserContext {
        primary_use_case: use_case,
        target_apps,
    };
    
    let snapshot = MetricsCollector::collect_snapshot(user_context)
        .await
        .map_err(|e| format!("Failed to collect metrics: {}", e))?;

    // 2. Get AI recommendations
    let ai_client = AI_CLIENT.lock().unwrap();
    let ai_response = ai_client
        .get_recommendations(&snapshot)
        .await
        .map_err(|e| format!("AI request failed: {}", e))?;

    // 3. Parse response
    let recommendations = RecommendationParser::parse(&ai_response)
        .map_err(|e| format!("Failed to parse recommendations: {}", e))?;

    // 4. Validate
    RecommendationParser::validate(&recommendations)
        .map_err(|e| format!("Invalid recommendations: {}", e))?;

    Ok(recommendations)
}

#[tauri::command]
pub fn set_ai_config(api_key: String, api_provider: String) -> Result<(), String> {
    let mut ai_client = AI_CLIENT.lock().unwrap();
    *ai_client = AiClient::new(api_key, api_provider);
    Ok(())
}
```

## Test Plan

### Unit Tests (Rust)
1. **Metrics Collector Tests**:
   - [ ] `test_collect_snapshot_success()` - All fields populated
   - [ ] `test_snapshot_serialization()` - JSON serialize/deserialize
   - [ ] `test_snapshot_timestamp_valid()` - Timestamp is recent
   - [ ] `test_user_context_required()` - use_case cannot be empty

2. **AI Client Tests** (Mock API):
   - [ ] `test_gemini_request_format()` - Correct JSON structure
   - [ ] `test_groq_request_format()` - OpenAI-compatible format
   - [ ] `test_api_error_handling()` - Handle 401, 429, 500
   - [ ] `test_timeout_handling()` - Timeout after 30s

3. **Recommendation Parser Tests**:
   - [ ] `test_parse_valid_json()` - Standard JSON response
   - [ ] `test_parse_markdown_json()` - Extract from ```json block
   - [ ] `test_parse_fallback_text()` - Handle non-JSON response
   - [ ] `test_validate_recommendations()` - Reject empty/invalid

### Integration Tests
1. **End-to-End Advisor Flow**:
   - [ ] Collect snapshot -> Call AI -> Parse -> Return to frontend
   - [ ] Test dengan mock AI response (no API key required)
   - [ ] Test error propagation (invalid API key, network error)

2. **API Integration** (require API key):
   - [ ] Call Gemini API dengan real snapshot
   - [ ] Call Groq API sebagai fallback
   - [ ] Verify response time < 10s
   - [ ] Test rate limiting handling

### Manual Tests (Pre-UI Implementation)
1. [ ] Set API key via environment variable: `GEMINI_API_KEY=...`
2. [ ] Run `get_smart_recommendations` dari Tauri console
3. [ ] Verify recommendations make sense (review manually)
4. [ ] Test dengan different use_case: "gaming", "productivity"

## Frontend UI Component

```javascript
// src/components/SmartAdvisor.jsx
import { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

export function SmartAdvisor() {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [useCase, setUseCase] = useState('mixed');
  const [targetApps, setTargetApps] = useState('');

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const result = await invoke('get_smart_recommendations', {
        useCase,
        targetApps: targetApps.split(',').map(s => s.trim()).filter(Boolean),
      });
      setRecommendations(result);
    } catch (err) {
      toast.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-red-600';
      case 'Medium': return 'text-yellow-600';
      case 'Low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-4">System Analysis</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Primary Use Case
            </label>
            <select
              value={useCase}
              onChange={(e) => setUseCase(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="gaming">Gaming</option>
              <option value="productivity">Productivity</option>
              <option value="streaming">Streaming</option>
              <option value="mixed">Mixed Usage</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Target Applications (comma-separated)
            </label>
            <input
              type="text"
              value={targetApps}
              onChange={(e) => setTargetApps(e.target.value)}
              placeholder="game.exe, obs64.exe, chrome.exe"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Analyze System'}
          </button>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations && (
        <div className="space-y-4">
          {/* Summary Card */}
          <div className="border rounded-lg p-4 bg-blue-50">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">Performance Score</h3>
                <p className="text-sm text-gray-600">{recommendations.summary}</p>
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {recommendations.performance_score}/100
              </div>
            </div>
          </div>

          {/* Recommendation Cards */}
          {recommendations.recommendations.map((rec, idx) => (
            <div key={idx} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className={`text-xs font-semibold ${getPriorityColor(rec.priority)}`}>
                    {rec.priority} Priority
                  </span>
                  <span className="ml-2 text-xs text-gray-500">{rec.category}</span>
                </div>
              </div>
              
              <h4 className="font-semibold mb-2">{rec.title}</h4>
              <p className="text-sm text-gray-700 mb-3">{rec.description}</p>
              
              <div className="bg-gray-50 rounded p-3">
                <p className="text-sm font-medium text-gray-900">
                  📋 Action: {rec.action}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```


## API Configuration

### Gemini API Setup
1. Get API key dari: https://makersuite.google.com/app/apikey
2. Free tier limit: 60 requests/minute
3. Model: `gemini-pro` (text-only)
4. Cost: Free (dengan quota limit)

### Groq API Setup (Fallback)
1. Get API key dari: https://console.groq.com
2. Free tier limit: 30 requests/minute
3. Model: `mixtral-8x7b-32768` (large context window)
4. Cost: Free beta (saat ini)

### API Key Storage
```rust
// Store API key securely via Tauri store plugin
use tauri_plugin_store::StoreBuilder;

pub fn load_api_config() -> Result<(String, String), String> {
    let store = StoreBuilder::new("xmost-config.json").build();
    
    let api_key = store.get("ai_api_key")
        .ok_or("API key not configured")?
        .as_str()
        .ok_or("Invalid API key format")?
        .to_string();
    
    let api_provider = store.get("ai_provider")
        .and_then(|v| v.as_str())
        .unwrap_or("gemini")
        .to_string();
    
    Ok((api_key, api_provider))
}
```

## Error Handling

### API Errors
- **401 Unauthorized**: "Invalid API key - please check configuration"
- **429 Rate Limit**: "Too many requests - please wait 60 seconds"
- **500 Server Error**: "AI service temporarily unavailable - try again later"
- **Timeout**: "Request timeout - check internet connection"

### Parsing Errors
- JSON parse failed: Use fallback text parser
- Empty recommendations: Return generic optimization tips
- Invalid structure: Log error, show user-friendly message

### Metrics Collection Errors
- Module unavailable: Skip that section, continue with available data
- Permission denied: Show warning, collect non-privileged metrics only

## Privacy & Security

### Data Sent to AI
- **Included**: Hardware specs, performance metrics, usage patterns
- **NOT Included**: Personal files, process names (only .exe), IP address
- **User Consent**: Show consent dialog on first use

### API Key Security
- Store encrypted via Tauri secure storage
- Never log API key in console/logs
- Allow user to delete key (Settings panel)

## Sample AI Prompt & Response

### Example Prompt Sent:
```json
{
  "timestamp": 1705234567,
  "hardware": {
    "cpu_name": "Intel Core i7-12700K",
    "cpu_cores": 12,
    "cpu_threads": 20,
    "total_ram_gb": 32,
    "gpu_name": "NVIDIA GeForce RTX 3080",
    "gpu_vram_gb": 10
  },
  "memory": {
    "total_mb": 32768,
    "used_mb": 16384,
    "standby_mb": 8192,
    "usage_percent": 50.0
  },
  "cpu": {
    "temperature_celsius": 65.0,
    "active_power_plan": "High Performance",
    "cpu_usage_percent": 35.0
  },
  "gpu": {
    "vendor": "Nvidia",
    "temperature_celsius": 58.0,
    "hags_enabled": true
  },
  "user_context": {
    "primary_use_case": "gaming",
    "target_apps": ["game.exe", "Discord.exe"]
  }
}
```

### Example AI Response:
```json
{
  "summary": "Your system is well-optimized for gaming with good thermals and adequate RAM.",
  "recommendations": [
    {
      "category": "Memory",
      "priority": "Medium",
      "title": "Reduce Standby List Size",
      "description": "You have 8GB of standby memory that could be freed. This won't improve gaming performance directly but will provide more available RAM for loading new assets.",
      "action": "Use the Memory Purge feature when standby exceeds 6GB before gaming sessions."
    },
    {
      "category": "CPU",
      "priority": "High",
      "title": "Consider Ultimate Performance Power Plan",
      "description": "High Performance plan is good, but Ultimate Performance eliminates micro-latencies by preventing CPU parking. For competitive gaming, this can reduce input lag by 2-5ms.",
      "action": "Switch to Ultimate Performance power plan in the CPU Tweaker module."
    },
    {
      "category": "GPU",
      "priority": "Low",
      "title": "GPU Temperature Optimal",
      "description": "58°C is excellent for an RTX 3080. HAGS is already enabled which is ideal for DX12 games. No action needed.",
      "action": "No changes recommended - current configuration is optimal."
    }
  ],
  "performance_score": 85
}
```

## Performance Considerations

### API Call Optimization
- Cache recommendations for 5 minutes (avoid redundant calls)
- Debounce analyze button (prevent spam clicks)
- Show loading spinner dengan estimated time (5-10s)

### Response Time Targets
- Metrics collection: < 500ms
- AI API call: < 8s (target: 5s)
- Parsing: < 100ms
- Total time: < 10s end-to-end

### Fallback Strategy
1. Try Gemini API (primary)
2. If fails, try Groq API (fallback)
3. If both fail, show cached recommendations (if available)
4. If no cache, show generic tips

## Future Enhancements

### Phase 2 Features
- Historical tracking (performance score over time)
- Auto-apply recommendations (dengan user confirmation)
- Custom tuning profiles (save/load configurations)
- Export recommendations as PDF report

### Phase 3 Features
- Multi-language support (prompt translation)
- Community recommendations (crowdsourced optimizations)
- A/B testing (compare before/after metrics)
- Integration dengan game launchers (auto-optimize per game)
