
import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysis, GroundingChunk } from '../types';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY (hoặc API_KEY legacy) environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

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
      2.  Nếu có sự cố, hãy phân tích chi tiết:
          - 'issueType': Xác định loại sự cố.
          - 'description': Mô tả chi tiết sự cố, bao gồm ước lượng khối lượng (nếu là rác), độ sâu (nếu là ngập), hoặc quy mô (nếu là sạt lở).
          - 'priority': Phân loại mức độ ưu tiên ('Cao', 'Trung bình', 'Thấp') dựa trên mức độ nguy hiểm và ảnh hưởng.
          - 'solution': Đề xuất giải pháp cụ thể, bao gồm cả hành động tức thời cho người dân và giải pháp lâu dài cho chính quyền.
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

  } catch (error: any) {
    console.error("Lỗi khi gọi API Gemini để phân tích hình ảnh:", error);
    
    // Kiểm tra lỗi quota (429 RESOURCE_EXHAUSTED)
    const errorString = JSON.stringify(error);
    if (errorString.includes("429") || errorString.includes("RESOURCE_EXHAUSTED")) {
      throw new Error("QUOTA_EXCEEDED: Hệ thống AI đang quá tải hoặc hết hạn mức. Bạn vẫn có thể gửi báo cáo trực tiếp mà không cần AI phân tích.");
    }
    
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
      systemInstruction: "Bạn là 'Trợ lý DA NANG GREEN', một chuyên gia AI cao cấp cho dự án 'DA NANG GREEN'. Nhiệm vụ của bạn là cung cấp thông tin chính xác, cập nhật và hữu ích về môi trường, thời tiết và thiên tai tại Đà Nẵng.\n\nNguyên tắc hoạt động:\n1. **Thông minh & Cập nhật:** Sử dụng Google Search để tìm kiếm thông tin mới nhất về tình hình thời tiết, lịch thu gom rác, hoặc các sự kiện môi trường tại Đà Nẵng nếu cần.\n2. **Bản địa hóa:** Sử dụng Google Maps để xác định vị trí và đưa ra lời khuyên cụ thể theo địa điểm (ví dụ: điểm thu gom rác gần nhất, tuyến đường tránh ngập).\n3. **Hành động cụ thể:** Luôn đề xuất giải pháp thực tế. Đừng chỉ nói lý thuyết.\n4. **Thân thiện & Khích lệ:** Khuyến khích người dân tham gia bảo vệ môi trường.\n5. **Định dạng:** Sử dụng Markdown để trình bày rõ ràng (in đậm, danh sách).\n\nNếu người dùng hỏi về tình trạng khẩn cấp (lũ lụt, sạt lở), hãy ưu tiên hướng dẫn an toàn và cung cấp số điện thoại khẩn cấp.",
      tools: [{ googleMaps: {} }, { googleSearch: {} }],
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

  } catch (error: any) {
    console.error("Lỗi khi gọi API Gemini để trò chuyện:", error);
    
    const errorString = JSON.stringify(error);
    if (errorString.includes("429") || errorString.includes("RESOURCE_EXHAUSTED")) {
      throw new Error("Hệ thống AI đang bận (hết hạn mức). Vui lòng quay lại sau vài phút.");
    }
    
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

  } catch (error: any) {
    console.error("Lỗi khi geocode với AI:", error);
    
    const errorString = JSON.stringify(error);
    if (errorString.includes("429") || errorString.includes("RESOURCE_EXHAUSTED")) {
      console.warn("AI Geocoding quota exceeded.");
    }
    
    return null;
  }
};
