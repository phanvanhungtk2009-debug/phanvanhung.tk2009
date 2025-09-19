import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysis } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    issueType: {
      type: Type.STRING,
      description: "Phân loại vấn đề môi trường được phát hiện trong ảnh (ví dụ: 'Rác thải sai quy định', 'Ngập úng', 'Cây xanh cần chăm sóc', 'Khác').",
      enum: ["Rác thải sai quy định", "Ngập úng", "Cây xanh cần chăm sóc", "Khác"],
    },
    description: {
      type: Type.STRING,
      description: "Mô tả ngắn gọn, súc tích về tình trạng vấn đề được thấy trong hình ảnh.",
    },
    priority: {
      type: Type.STRING,
      description: "Đánh giá mức độ ưu tiên cần xử lý ('Cao', 'Trung bình', 'Thấp') dựa trên mức độ nghiêm trọng và ảnh hưởng của vấn đề trong ảnh.",
      enum: ["Cao", "Trung bình", "Thấp"],
    }
  },
  required: ["issueType", "description", "priority"],
};

// This function now returns only the AIAnalysis part of the report
export const analyzeEnvironmentalImage = async (base64Image: string, mimeType: string): Promise<AIAnalysis> => {
  try {
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    };

    const textPart = {
      text: `Bạn là một chuyên gia AI giám sát môi trường cho thành phố Đà Nẵng, Việt Nam. Phân tích hình ảnh này và trả về một đối tượng JSON. Xác định loại vấn đề môi trường, mô tả chi tiết và phân loại mức độ ưu tiên xử lý. Hãy tuân thủ nghiêm ngặt schema đã cho và không bao gồm các trường khác.`
    };
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });
    
    const jsonString = response.text;
    const reportData = JSON.parse(jsonString) as AIAnalysis;
    
    if (!reportData.issueType || !reportData.description || !reportData.priority) {
      throw new Error("Phản hồi từ AI không đầy đủ thông tin.");
    }

    return reportData;

  } catch (error) {
    console.error("Error calling Gemini API for image analysis:", error);
    throw new Error("Không thể phân tích hình ảnh. Vui lòng thử lại sau.");
  }
};

export const askAIAboutEnvironment = async (question: string): Promise<string> => {
  try {
     const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: question,
      config: {
        systemInstruction: "Bạn là một trợ lý AI thân thiện tên là 'Trợ lý Xanh', chuyên trả lời các câu hỏi của người dân Đà Nẵng về bảo vệ môi trường, tái chế, phân loại rác và các chủ đề liên quan. Hãy trả lời một cách ngắn gọn, dễ hiểu, và tích cực. Nếu được hỏi về một loại rác thải, hãy phân tích ngắn gọn về nó (ví dụ: 'Chai nhựa là rác tái chế, cần được làm sạch trước khi bỏ vào thùng màu vàng...').",
      },
    });

    return response.text;

  } catch (error) {
    console.error("Error calling Gemini API for chat:", error);
    throw new Error("Lỗi khi kết nối với trợ lý AI.");
  }
}