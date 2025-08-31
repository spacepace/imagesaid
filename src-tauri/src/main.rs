// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::time::Instant;
use base64::prelude::*;

// ============================================================================
// 数据结构定义
// ============================================================================

/**
 * 重命名操作结构体
 */
#[derive(Debug, Serialize, Deserialize)]
struct RenameOperation {
    old_path: String, // 原文件路径
    new_name: String, // 新文件名（不含扩展名）
}

/**
 * 图片处理结果结构体
 */
#[derive(Debug, Serialize, Deserialize)]
struct ImageProcessingResult {
    new_name: String, // 生成的新文件名
    processing_time: u64, // 处理用时（毫秒）
}

/**
 * Ollama API响应结构体
 */
#[derive(Debug, Serialize, Deserialize)]
struct OllamaResponse {
    response: String, // AI生成的响应文本
}

/**
 * Ollama模型详细信息
 */
#[derive(Debug, Deserialize, Serialize, Default)]
struct OllamaModelDetails {
    #[serde(default)]
    format: String, // 模型格式
    #[serde(default)]
    family: String, // 模型系列
    #[serde(default)]
    parameter_size: String, // 参数大小
    #[serde(default)]
    quantization_level: String, // 量化级别
}

/**
 * Ollama模型信息
 */
#[derive(Debug, Deserialize, Serialize)]
struct OllamaModel {
    name: String, // 模型名称
    #[serde(default)]
    size: i64, // 模型大小
    #[serde(default)]
    digest: String, // 模型摘要
    #[serde(default)]
    details: OllamaModelDetails, // 模型详细信息
}

/**
 * Ollama模型列表响应
 */
#[derive(Debug, Deserialize)]
struct OllamaModelsResponse {
    models: Vec<OllamaModel>, // 模型列表
}

/**
 * Ollama API请求结构体
 */
#[derive(Debug, Serialize, Deserialize)]
struct OllamaRequest {
    model: String, // 使用的模型名称
    prompt: String, // 提示词
    images: Vec<String>, // Base64编码的图片数据
    stream: bool, // 是否流式响应
}

/**
 * 图片处理配置
 */
#[derive(Debug, Serialize, Deserialize)]
struct ImageProcessingConfig {
    model: String, // 模型名称
    context_length: usize, // 上下文窗口大小
    api_url: String, // API地址
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 清理文件名，移除不合法的字符
 * 
 * @param raw_name 原始文件名
 * @return 清理后的文件名
 */
fn clean_filename(raw_name: &str) -> String {
    raw_name
        .trim()
        .replace('\n', "")
        .replace('\r', "")
        .replace('"', "")
        .replace('/', "_")
        .replace('\\', "_")
        .replace(':', "_")
        .replace('*', "_")
        .replace('?', "_")
        .replace('<', "_")
        .replace('>', "_")
        .replace('|', "_")
        .chars()
        .take(100) // 限制文件名长度为100字符
        .collect()
}

/**
 * 压缩图片数据以适应模型的上下文窗口大小
 * 
 * @param image_data 原始图片数据
 * @param max_size 最大允许大小（字节）
 * @return 压缩后的图片数据
 */
fn compress_image(image_data: &[u8], max_size: usize) -> Result<Vec<u8>, String> {
    use image::io::Reader as ImageReader;
    
    // 解码图片
    let img = ImageReader::new(std::io::Cursor::new(image_data))
        .with_guessed_format()
        .map_err(|e| format!("Failed to read image: {}", e))?
        .decode()
        .map_err(|e| format!("Failed to decode image: {}", e))?;
    
    let original_size = image_data.len();
    let mut quality = 95;
    let mut compressed_data = Vec::new();
    
    // 第一步：尝试通过降低JPEG质量来压缩
    while quality > 10 {
        compressed_data.clear();
        
        // 重新编码图片
        img.write_with_encoder(
            image::codecs::jpeg::JpegEncoder::new_with_quality(
                std::io::Cursor::new(&mut compressed_data),
                quality
            )
        ).map_err(|e| format!("Failed to encode image: {}", e))?;
        
        if compressed_data.len() <= max_size {
            println!("Compressed image from {} bytes to {} bytes (quality: {})", 
                    original_size, compressed_data.len(), quality);
            return Ok(compressed_data);
        }
        
        quality -= 5; // 每次降低5%质量
    }
    
    // 第二步：如果质量压缩不够，则调整图片尺寸
    let original_img_for_resize = img.clone();
    let mut scale = 0.9;
    
    while scale > 0.1 {
        let new_width = (original_img_for_resize.width() as f32 * scale) as u32;
        let new_height = (original_img_for_resize.height() as f32 * scale) as u32;
        
        let resized_img = original_img_for_resize.resize(new_width, new_height, image::imageops::FilterType::Lanczos3);
        
        compressed_data.clear();
        resized_img.write_with_encoder(
            image::codecs::jpeg::JpegEncoder::new_with_quality(
                std::io::Cursor::new(&mut compressed_data),
                85
            )
        ).map_err(|e| format!("Failed to encode resized image: {}", e))?;
        
        if compressed_data.len() <= max_size {
            println!("Resized and compressed image from {} bytes to {} bytes (scale: {})", 
                    original_size, compressed_data.len(), scale);
            return Ok(compressed_data);
        }
        
        scale -= 0.1; // 每次缩小10%
    }
    
    Err("无法将图片压缩到指定大小".to_string())
}

/**
 * 读取图片文件并返回base64编码数据
 * 
 * @param image_path 图片文件路径
 * @return base64编码的图片数据
 */
#[tauri::command]
async fn read_image_file(image_path: String) -> Result<String, String> {
    println!("Reading image file: {}", image_path);
    
    // 检查文件是否存在
    let path = Path::new(&image_path);
    if !path.exists() {
        return Err(format!("文件不存在：{}", image_path));
    }
    
    // 读取图片文件
    let image_data = match fs::read(&image_path) {
        Ok(data) => {
            println!("Successfully read {} bytes from {}", data.len(), image_path);
            data
        },
        Err(e) => return Err(format!("读取图片失败：{}。文件路径：{}", e, image_path)),
    };

    // 将图片编码为base64
    let base64_image = base64::prelude::BASE64_STANDARD.encode(&image_data);
    
    // 获取文件扩展名来确定MIME类型
    let mime_type = match path.extension().and_then(|s| s.to_str()) {
        Some("jpg") | Some("jpeg") => "image/jpeg",
        Some("png") => "image/png",
        Some("webp") => "image/webp",
        Some("avif") => "image/avif",
        _ => "image/jpeg", // 默认
    };
    
    // 返回data URL格式
    Ok(format!("data:{};base64,{}", mime_type, base64_image))
}

// ============================================================================
// Tauri 命令函数
// ============================================================================

/**
 * 测试Ollama连接
 * 
 * @param api_url Ollama API地址
 * @return 连接结果消息
 */
#[tauri::command]
async fn test_connection(api_url: String) -> Result<String, String> {
    let client = reqwest::Client::new();
    let test_url = format!("{}/api/tags", api_url.trim_end_matches('/'));
    
    match client.get(&test_url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                Ok("连接成功！Ollama服务正常运行".to_string())
            } else {
                Err(format!("连接失败：HTTP {}", response.status()))
            }
        }
        Err(e) => Err(format!("连接失败：{}", e)),
    }
}

/**
 * 为单张图片生成新名称
 * 
 * @param image_path 图片文件路径
 * @param prompt 提示词
 * @param api_url Ollama API地址
 * @param model 使用的模型名称
 * @param context_length 上下文窗口大小（可选）
 * @return 图片处理结果
 */
#[tauri::command]
async fn generate_single_name(
    image_path: String, 
    prompt: String, 
    api_url: String, 
    model: String, 
    context_length: Option<usize>
) -> Result<ImageProcessingResult, String> {
    let start_time = Instant::now();
    println!("Processing image: {}", image_path);
    
    // 检查路径是否为非真实文件路径
    if image_path.starts_with("blob:") || 
       image_path.starts_with("dev-") || 
       image_path.starts_with("browser-") || 
       image_path.starts_with("temp-") {
        return Err("当前文件路径无效。请尝试：1) 重新拖拽文件到应用窗口 2) 检查Tauri文件拖拽权限".to_string());
    }
    
    // 检查文件是否存在
    let path = Path::new(&image_path);
    if !path.exists() {
        return Err(format!("文件不存在：{}。请确保文件路径正确。", image_path));
    }
    
    // 读取图片文件
    let image_data = match fs::read(&image_path) {
        Ok(data) => {
            println!("Successfully read {} bytes from {}", data.len(), image_path);
            data
        },
        Err(e) => return Err(format!("读取图片失败：{}。文件路径：{}", e, image_path)),
    };

    // 根据上下文窗口大小计算图片最大大小
    let context_length = context_length.unwrap_or(4096);
    let max_image_size = (context_length * 1024) / 4; // 为图片预留1/4的上下文空间
    
    // 压缩图片
    let compressed_data = match compress_image(&image_data, max_image_size) {
        Ok(data) => data,
        Err(e) => {
            println!("Warning: Failed to compress image, using original: {}", e);
            image_data
        }
    };

    // 将图片编码为base64
    let base64_image = base64::prelude::BASE64_STANDARD.encode(&compressed_data);

    // 构造请求
    let request = OllamaRequest {
        model: model.clone(),
        prompt: format!("{}。请只返回文件名，不要包含扩展名和其他说明。", prompt),
        images: vec![base64_image],
        stream: false,
    };

    // 发送请求到Ollama
    let client = reqwest::Client::new();
    let url = format!("{}/api/generate", api_url.trim_end_matches('/'));
    
    match client.post(&url).json(&request).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<OllamaResponse>().await {
                    Ok(ollama_response) => {
                        // 清理响应文本，移除不需要的字符
                        let cleaned_name = clean_filename(&ollama_response.response);
                        let processing_time = start_time.elapsed().as_millis() as u64;
                        
                        Ok(ImageProcessingResult {
                            new_name: cleaned_name,
                            processing_time,
                        })
                    }
                    Err(e) => Err(format!("解析响应失败：{}", e)),
                }
            } else {
                Err(format!("API请求失败：HTTP {}", response.status()))
            }
        }
        Err(e) => Err(format!("网络请求失败：{}", e)),
    }
}

/**
 * 执行批量重命名
 * 
 * @param renames 重命名操作列表
 * @return 操作结果
 */
#[tauri::command]
async fn apply_renames(renames: Vec<RenameOperation>) -> Result<(), String> {
    for rename_op in renames {
        let old_path = Path::new(&rename_op.old_path);
        
        if !old_path.exists() {
            return Err(format!("文件不存在：{}", rename_op.old_path));
        }

        // 获取文件扩展名
        let extension = old_path
            .extension()
            .and_then(|s| s.to_str())
            .unwrap_or("");

        // 构造新的完整文件名
        let new_filename = if extension.is_empty() {
            rename_op.new_name
        } else {
            format!("{}.{}", rename_op.new_name, extension)
        };

        // 构造新路径
        let new_path = old_path.with_file_name(&new_filename);

        // 执行重命名
        match fs::rename(old_path, &new_path) {
            Ok(_) => continue,
            Err(e) => return Err(format!("重命名文件失败 {}: {}", rename_op.old_path, e)),
        }
    }

    Ok(())
}

/**
 * 获取图片文件信息
 * 
 * @param image_path 图片文件路径
 * @return 文件信息
 */
#[tauri::command]
async fn get_image_info(image_path: String) -> Result<HashMap<String, String>, String> {
    let path = Path::new(&image_path);
    let mut info = HashMap::new();
    
    // 获取文件名
    if let Some(filename) = path.file_name().and_then(|s| s.to_str()) {
        info.insert("filename".to_string(), filename.to_string());
    }
    
    // 获取文件大小
    match fs::metadata(&image_path) {
        Ok(metadata) => {
            let size = metadata.len();
            info.insert("size".to_string(), format!("{} bytes", size));
        }
        Err(_) => {
            info.insert("size".to_string(), "Unknown".to_string());
        }
    }

    Ok(info)
}

/**
 * 获取Ollama模型列表
 * 
 * @param api_url Ollama API地址
 * @return 模型列表
 */
#[tauri::command]
async fn get_ollama_models(api_url: String) -> Result<Vec<OllamaModel>, String> {
    println!("Getting Ollama models from: {}", api_url);
    let client = reqwest::Client::new();
    let url = format!("{}/api/tags", api_url.trim_end_matches('/'));
    
    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                let models_response: OllamaModelsResponse = response.json().await
                    .map_err(|e| format!("解析模型列表失败：{}", e))?;
                
                println!("Found {} models", models_response.models.len());
                Ok(models_response.models)
            } else {
                let status = response.status();
                let text = response.text().await.unwrap_or_else(|_| "无法读取响应".to_string());
                Err(format!("获取模型列表失败，状态码：{}，响应：{}", status, text))
            }
        }
        Err(e) => Err(format!("连接Ollama失败：{}", e)),
    }
}

// ============================================================================
// 主函数
// ============================================================================

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            test_connection,
            generate_single_name,
            apply_renames,
            get_image_info,
            get_ollama_models,
            read_image_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}