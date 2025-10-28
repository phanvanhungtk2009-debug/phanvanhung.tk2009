import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysis } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    isIssuePresent: {
      type: Type.BOOLEAN,
      description: "Hình ảnh có chứa một sự cố môi trường đáng báo cáo không (ví dụ: rác thải, ngập lụt, sạt lở đất)? Trả lời 'true' hoặc 'false'.",
    },
    issueType: {
      type: Type.STRING,
      description: "Nếu có sự cố, phân loại sự cố (ví dụ: 'Xả rác không đúng nơi quy định', 'Ngập lụt', 'Sạt lở đất', 'Cần chăm sóc cây xanh', 'Khác'). Nếu không có sự cố, trả về 'Không có sự cố'.",
      enum: ["Xả rác không đúng nơi quy định", "Ngập lụt", "Sạt lở đất", "Cần chăm sóc cây xanh", "Khác", "Không có sự cố"],
    },
    description: {
      type: Type.STRING,
      description: "Nếu có sự cố, mô tả ngắn gọn sự cố. Nếu không, mô tả ngắn gọn nội dung hình ảnh.",
    },
    priority: {
      type: Type.STRING,
      description: "Nếu có sự cố, đánh giá mức độ ưu tiên ('Cao', 'Trung bình', 'Thấp'). Nếu không, trả về 'Thấp'.",
      enum: ["Cao", "Trung bình", "Thấp"],
    },
    solution: {
        type: Type.STRING,
        description: "Nếu có sự cố, đề xuất một giải pháp cụ thể, có thể hành động được. Nếu không có sự cố, trả về 'Không cần hành động.'.",
    }
  },
  required: ["isIssuePresent", "issueType", "description", "priority", "solution"],
};

// Hàm này bây giờ xác thực, phân tích và đề xuất giải pháp trong một lần gọi
export const analyzeEnvironmentalImage = async (base64Image: string, mimeType: string): Promise<AIAnalysis> => {
  try {
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    };

    const textPart = {
      text: `Bạn là một chuyên gia giám sát môi trường bằng AI cho thành phố Đà Nẵng, Việt Nam. Phân tích hình ảnh này và trả về một đối tượng JSON.
      1.  Đầu tiên, xác định xem hình ảnh có chứa một sự cố môi trường thực sự như rác thải, ngập lụt, hoặc sạt lở đất không ('isIssuePresent').
      2.  Nếu có sự cố, hãy phân tích chi tiết: xác định loại sự cố ('issueType'), cung cấp mô tả ('description'), phân loại mức độ ưu tiên ('priority'), và đề xuất một giải pháp cụ thể ('solution').
      3.  Nếu không có sự cố, hãy trả về 'isIssuePresent: false' và điền các trường còn lại với giá trị mặc định phù hợp (ví dụ: issueType: 'Không có sự cố').
      Tuân thủ nghiêm ngặt schema được cung cấp.`
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
    const analysisResult = JSON.parse(jsonString) as AIAnalysis;
    
    if (analysisResult.isIssuePresent === undefined || !analysisResult.issueType || !analysisResult.description || !analysisResult.priority || !analysisResult.solution) {
      throw new Error("Phản hồi từ AI thiếu thông tin bắt buộc.");
    }

    return analysisResult;

  } catch (error) {
    console.error("Lỗi khi gọi API Gemini để phân tích hình ảnh:", error);
    throw new Error("Không thể phân tích hình ảnh. Vui lòng thử lại sau.");
  }
};


export const askAIAboutEnvironment = async (question: string): Promise<string> => {
  try {
     const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: question,
      config: {
        systemInstruction: "Bạn là 'Trợ lý DA NANG GREEN', một chuyên gia AI cho dự án 'DA NANG GREEN'. Nhiệm vụ của bạn là cung cấp cho người dân những câu trả lời, lời khuyên và giải pháp thiết thực, có thể hành động được đối với các vấn đề môi trường ở Đà Nẵng.\n\nHãy tuân thủ các nguyên tắc sau:\n1.  **Luôn cung cấp giải pháp:** Đừng chỉ trả lời câu hỏi; luôn đề xuất các bước hành động cụ thể. Ví dụ: nếu người dùng hỏi về rác trên đường, hãy đề xuất: '1. Bạn có thể tổ chức một buổi dọn dẹp nhỏ cùng hàng xóm. 2. Đối với lượng rác lớn hoặc chất thải nguy hại, hãy liên hệ đường dây nóng của Sở Tài nguyên và Môi trường qua số [số điện thoại giả, ví dụ: 1900.xxxx]. 3. Sử dụng ứng dụng DA NANG GREEN để báo cáo chính thức nếu đó là một điểm nóng ô nhiễm.'\n2.  **Bản địa hóa:** Ưu tiên thông tin và giải pháp liên quan đến Đà Nẵng (ngay cả khi là giả định không có dữ liệu thực). Đề cập đến các địa danh và chương trình của thành phố.\n3.  **Thân thiện và khuyến khích:** Sử dụng ngôn ngữ tích cực, dễ hiểu, khuyến khích người dân hành động.\n4.  **Hướng dẫn sử dụng ứng dụng:** Khi thích hợp, hãy hướng dẫn người dùng cách sử dụng các tính năng của ứng dụng 'DA NANG GREEN' để báo cáo sự cố.\n5.  **Cấu trúc rõ ràng:** Trình bày các giải pháp dưới dạng danh sách hoặc gạch đầu dòng để dễ đọc.",
      },
    });

    return response.text;

  } catch (error) {
    console.error("Lỗi khi gọi API Gemini để trò chuyện:", error);
    throw new Error("Lỗi kết nối với trợ lý AI.");
  }
}