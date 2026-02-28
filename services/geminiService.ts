
import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysis, GroundingChunk } from '../types';

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
  const callGemini = async (retryCount = 0): Promise<AIAnalysis> => {
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
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        }
      });
      
      const jsonString = response.text;
      if (!jsonString) {
          throw new Error("Empty response from AI");
      }
      const analysisResult = JSON.parse(jsonString) as AIAnalysis;
      
      if (analysisResult.isIssuePresent === undefined || !analysisResult.issueType || !analysisResult.description || !analysisResult.priority || !analysisResult.solution) {
        throw new Error("Phản hồi từ AI thiếu thông tin bắt buộc.");
      }

      return analysisResult;

    } catch (error: any) {
      console.error(`Lỗi khi gọi API Gemini (lần thử ${retryCount + 1}):`, error);
      
      const errorString = JSON.stringify(error);
      
      // Retry on 500 or 503 errors, up to 2 times
      if ((errorString.includes("500") || errorString.includes("503") || errorString.includes("Internal Server Error")) && retryCount < 2) {
          console.log(`Retrying Gemini API call... (${retryCount + 1}/2)`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
          return callGemini(retryCount + 1);
      }

      if (errorString.includes("429") || errorString.includes("RESOURCE_EXHAUSTED")) {
        throw new Error("QUOTA_EXCEEDED: Hệ thống AI đang quá tải hoặc hết hạn mức. Bạn vẫn có thể gửi báo cáo trực tiếp mà không cần AI phân tích.");
      }
      
      throw new Error("Không thể phân tích hình ảnh. Vui lòng thử lại sau.");
    }
  };

  return callGemini();
};


export const askAIAboutEnvironment = async (
  question: string,
  userLocation: { latitude: number; longitude: number } | null
): Promise<{ text: string, groundingChunks?: GroundingChunk[] }> => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = {
      systemInstruction: `Bạn là 'Trợ lý Xanh' - linh hồn của dự án DA NANG GREEN, hiện đang quản lý hệ thống giám sát môi trường hợp nhất cho toàn vùng Đà Nẵng và Quảng Nam.

Phong cách giao tiếp:
1. **Lịch sự & Thấu cảm:** Luôn bắt đầu bằng lời chào ấm áp. Thể hiện sự thấu hiểu sâu sắc đối với lo lắng của người dân về môi trường trong bối cảnh phát triển vùng.
2. **Ngắn gọn & Xúc tích:** Trả lời thẳng vào vấn đề, tránh rườm rà. Ưu tiên các câu trả lời cô đọng nhưng đầy đủ ý nghĩa.
3. **Bối cảnh Lịch sử & Địa lý:** Khi nói về một địa điểm, hãy lồng ghép khéo léo sự gắn kết lịch sử giữa Đà Nẵng và Quảng Nam (ví dụ: sự kết nối của dòng sông Cổ Cò, lịch sử giao thương Hội An - Đà Nẵng) để tạo chiều sâu và sự gắn kết vùng.
4. **Giàu cảm xúc:** Sử dụng các từ ngữ biểu cảm nhẹ nhàng để khơi gợi tình yêu quê hương và ý thức bảo vệ môi trường chung cho cả hai địa phương.
5. **Hành động:** Luôn kết thúc bằng một lời khuyên nhỏ, thiết thực.

Nguyên tắc chuyên môn:
- **Hợp nhất Dữ liệu:** Sử dụng Google Search và Google Maps để cập nhật tin tức, thời tiết và bản đồ mới nhất cho toàn bộ khu vực Đà Nẵng và Quảng Nam như một vùng giám sát thống nhất.
- **Bản đồ & Vị trí:** Tìm kiếm chính xác các điểm thu gom rác, trạm cứu hộ hoặc khu bảo tồn trên toàn vùng (từ Liên Chiểu đến Núi Thành, từ Hội An đến Tây Giang).
- **An toàn là trên hết:** Ưu tiên an toàn tính mạng trong các tình huống khẩn cấp trên toàn địa bàn.

Định dạng: Sử dụng Markdown (in đậm, nghiêng) để tạo điểm nhấn.`,
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
