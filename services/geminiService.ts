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

export const isImageTrash = async (base64Image: string, mimeType: string): Promise<boolean> => {
  try {
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    };

    const textPart = {
      text: "Phân tích hình ảnh này. Hình ảnh có chứa rác thải, rác bừa bãi, hoặc bãi rác không? Chỉ trả lời 'Có' hoặc 'Không'."
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
    });

    const resultText = response.text.trim().toLowerCase();
    return resultText.includes('có');

  } catch (error) {
    console.error("Error calling Gemini API for trash validation:", error);
    throw new Error("Không thể phân tích hình ảnh để kiểm tra rác thải.");
  }
};

export const askAIAboutEnvironment = async (question: string): Promise<string> => {
  try {
     const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: question,
      config: {
        systemInstruction: "Bạn là 'Trợ lý Môi trường Đà Nẵng', một chuyên gia AI của dự án 'Đà Nẵng Xanh'. Nhiệm vụ của bạn là cung cấp cho người dân những câu trả lời, lời khuyên và giải pháp thiết thực, có tính hành động về các vấn đề môi trường tại Đà Nẵng.\n\nHãy tuân thủ các nguyên tắc sau:\n1.  **Luôn đưa ra giải pháp:** Không chỉ trả lời câu hỏi, hãy luôn đề xuất các bước hành động cụ thể. Ví dụ, nếu người dùng hỏi về rác thải trên đường phố, hãy gợi ý: '1. Bạn có thể tổ chức một buổi dọn dẹp nhỏ cùng hàng xóm. 2. Đối với lượng rác lớn hoặc rác thải nguy hại, hãy liên hệ đường dây nóng của Sở Tài nguyên và Môi trường qua số [số điện thoại giả định, ví dụ: 1900.xxxx]. 3. Sử dụng ứng dụng Đà Nẵng Xanh để báo cáo chính thức nếu đó là điểm nóng ô nhiễm.'\n2.  **Địa phương hóa:** Ưu tiên các thông tin và giải pháp liên quan đến Đà Nẵng (dù là giả định nếu không có dữ liệu thực tế). Nhắc đến các địa danh, chương trình của thành phố.\n3.  **Thân thiện và khích lệ:** Sử dụng ngôn ngữ tích cực, dễ hiểu, khuyến khích người dân hành động.\n4.  **Hướng dẫn sử dụng app:** Khi thích hợp, hãy hướng dẫn người dùng cách sử dụng các tính năng của ứng dụng 'Đà Nẵng Xanh' để báo cáo vấn đề.\n5.  **Cấu trúc rõ ràng:** Trình bày các giải pháp dưới dạng danh sách hoặc gạch đầu dòng để người dùng dễ theo dõi.",
      },
    });

    return response.text;

  } catch (error) {
    console.error("Error calling Gemini API for chat:", error);
    throw new Error("Lỗi khi kết nối với trợ lý AI.");
  }
}