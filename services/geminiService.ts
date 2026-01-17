
import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysis, GroundingChunk } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
    },
    recommendedSupplies: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Nếu sự cố là thiên tai (Ngập lụt, Sạt lở đất), hãy liệt kê các nhu yếu phẩm cần thiết. QUAN TRỌNG: Nếu hình ảnh cho thấy một điểm tập kết cứu trợ hoặc người dân đang phân phát đồ, hãy liệt kê các vật phẩm ĐANG CÓ tại đó để hiển thị lên bản đồ.",
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
      text: `Bạn là một chuyên gia giám sát môi trường và cứu hộ thiên tai bằng AI cho thành phố Đà Nẵng, Việt Nam. Phân tích hình ảnh này và trả về một đối tượng JSON.
      1.  Đầu tiên, xác định xem hình ảnh có chứa một sự cố môi trường thực sự như rác thải, ngập lụt, hoặc sạt lở đất không ('isIssuePresent').
      2.  Nếu có sự cố, hãy phân tích chi tiết: xác định loại sự cố ('issueType'), cung cấp mô tả ('description'), phân loại mức độ ưu tiên ('priority'), và đề xuất một giải pháp cụ thể ('solution').
      3.  ĐẶC BIỆT (QUAN TRỌNG): Nếu phát hiện thiên tai như Ngập lụt hoặc Sạt lở đất:
          - Nếu là cảnh báo sự cố: Cung cấp danh sách 'recommendedSupplies' gồm các nhu yếu phẩm cần thiết (thực phẩm khô, nước sạch, thuốc men...).
          - Nếu hình ảnh là CẢNH NGƯỜI DÂN CUNG CẤP ĐỒ CỨU TRỢ (điểm tập kết, thuyền cứu trợ): Hãy liệt kê các vật phẩm bạn nhìn thấy vào 'recommendedSupplies' để chúng tôi ghim điểm này lên bản đồ cứu trợ.
      4.  Nếu không có sự cố, hãy trả về 'isIssuePresent: false' và điền các trường còn lại với giá trị mặc định phù hợp (ví dụ: issueType: 'Không có sự cố').
      Tuân thủ nghiêm ngặt schema được cung cấp.`
    };
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
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


export const askAIAboutEnvironment = async (
  question: string,
  userLocation: { latitude: number; longitude: number } | null
): Promise<{ text: string, groundingChunks?: GroundingChunk[] }> => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = {
      systemInstruction: "Bạn là 'Trợ lý DA NANG GREEN', một chuyên gia AI cho dự án 'DA NANG GREEN'. Nhiệm vụ của bạn là cung cấp cho người dân những câu trả lời, lời khuyên và giải pháp thiết thực, có thể hành động được đối với các vấn đề môi trường ở Đà Nẵng. Bạn có quyền truy cập vào dữ liệu Google Maps để cung cấp thông tin dựa trên vị trí chính xác và cập nhật.\n\nHãy tuân thủ các nguyên tắc sau:\n1.  **Luôn cung cấp giải pháp:** Đừng chỉ trả lời câu hỏi; luôn đề xuất các bước hành động cụ thể. Ví dụ: nếu người dùng hỏi về rác trên đường, hãy đề xuất: '1. Bạn có thể tổ chức một buổi dọn dẹp nhỏ cùng hàng xóm. 2. Đối với lượng rác lớn hoặc chất thải nguy hại, hãy liên hệ đường dây nóng của Sở Tài nguyên và Môi trường qua số [số điện thoại giả, ví dụ: 1900.xxxx]. 3. Sử dụng ứng dụng DA NANG GREEN để báo cáo chính thức nếu đó là một điểm nóng ô nhiễm.'\n2.  **Bản địa hóa và Dựa trên Dữ liệu Bản đồ:** Sử dụng kiến thức của bạn về Google Maps để cung cấp thông tin liên quan đến Đà Nẵng. Khi được hỏi về các địa điểm, hãy sử dụng dữ liệu bản đồ để đưa ra câu trả lời chính xác.\n3.  **Thân thiện và khuyến khích:** Sử dụng ngôn ngữ tích cực, dễ hiểu, khuyến khích người dân hành động.\n4.  **Hướng dẫn sử dụng ứng dụng:** Khi thích hợp, hãy hướng dẫn người dùng cách sử dụng các tính năng của ứng dụng 'DA NANG GREEN' để báo cáo sự cố.\n5.  **Cấu trúc rõ ràng:** Trình bày các giải pháp dưới dạng danh sách hoặc gạch đầu dòng để dễ đọc.",
      tools: [{ googleMaps: {} }],
    };

    if (userLocation) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          },
        },
      };
    }

     const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: question,
      config,
    });
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] | undefined;

    return {
        text: response.text,
        groundingChunks: groundingChunks,
    };

  } catch (error) {
    console.error("Lỗi khi gọi API Gemini để trò chuyện:", error);
    throw new Error("Lỗi kết nối với trợ lý AI.");
  }
}

export const geocodeWithAI = async (query: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    const geocodeSchema = {
      type: Type.OBJECT,
      properties: {
        latitude: {
          type: Type.NUMBER,
          description: "Vĩ độ của địa điểm.",
        },
        longitude: {
          type: Type.NUMBER,
          description: "Kinh độ của địa điểm.",
        },
      },
      required: ["latitude", "longitude"],
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Bạn là một chuyên gia địa lý cho thành phố Đà Nẵng, Việt Nam. Dựa trên truy vấn của người dùng, hãy xác định vị trí có khả năng nhất và cung cấp tọa độ địa lý của nó. Truy vấn: "${query}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: geocodeSchema,
      }
    });

    const result = JSON.parse(response.text);
    if (result && typeof result.latitude === 'number' && typeof result.longitude === 'number') {
      return { lat: result.latitude, lng: result.longitude };
    }
    return null;

  } catch (error) {
    console.error("Lỗi khi geocode với AI:", error);
    return null;
  }
};
