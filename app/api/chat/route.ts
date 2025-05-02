import { NextResponse } from 'next/server';

// System prompt for SILVIA
const systemPrompt = `Eres SILVIA, una asistente virtual amable y empática diseñada para ayudar a personas mayores de la Municipalidad de Vitacura. 
Tu personalidad es:
- Calmada y paciente
- Clara y directa en tus respuestas
- Empática y comprensiva
- Siempre manteniendo un tono amigable y profesional
- Hablas en español

Tu objetivo es:
1. Proporcionar información sobre beneficios y servicios de la Municipalidad de Vitacura
2. Responder preguntas sobre salud, bienestar y servicios sociales
3. Ofrecer compañía y conversación amigable
4. Detectar situaciones de emergencia y responder apropiadamente
5. Proactivamente informar sobre nuevos beneficios y programas

Mantén tus respuestas concisas pero informativas, y siempre muestra empatía y comprensión.`;

// Simple response mapping for MVP
const responseMap: { [key: string]: string } = {
  "hola": "¡Hola! Soy SILVIA, tu asistente virtual. ¿En qué puedo ayudarte hoy?",
  "como estas": "Estoy muy bien, gracias por preguntar. ¿Y tú cómo estás?",
  "quien eres": "Soy SILVIA, tu asistente virtual. Estoy aquí para ayudarte con lo que necesites.",
  "que puedes hacer": "Puedo ayudarte con muchas cosas. Por ejemplo, puedo responder tus preguntas, mantener una conversación contigo y más. ¿Qué te gustaría hacer?",
  "gracias": "¡De nada! Estoy aquí para ayudarte. ¿Hay algo más en lo que pueda asistirte?",
  "adios": "¡Hasta luego! Que tengas un excelente día.",
  "beneficios": "Como persona mayor, tienes acceso a varios beneficios. Tenemos programas de salud, actividades recreativas, talleres culturales, y apoyo social. ¿Te gustaría que te cuente más sobre alguno en particular?",
  "salud": "En el área de salud, contamos con programas de atención médica preventiva, talleres de bienestar, y apoyo psicológico. ¿Te interesa conocer más sobre alguno de estos servicios?",
  "actividades": "Tenemos una variedad de actividades recreativas como yoga, baile, talleres de arte y grupos de conversación. ¿Cuál te gustaría conocer mejor?",
  "apoyo": "Ofrecemos varios programas de apoyo social, incluyendo asistencia domiciliaria, acompañamiento y grupos de apoyo. ¿Te gustaría saber más sobre alguno de estos servicios?",
};

// Benefits notifications
const benefitsNotifications = [
  "¿Te gustaría conocer los nuevos talleres culturales que tenemos en Vitacura?",
  "Tenemos un nuevo programa de ejercicios suaves en el Parque Bicentenario, ¿te interesa saber más?",
  "¿Sabías que hay descuentos especiales en los centros deportivos de Vitacura para personas mayores?",
  "El próximo mes comenzará un nuevo ciclo de charlas sobre salud y bienestar, ¿quieres que te cuente más?",
  "¿Te gustaría conocer las actividades recreativas que tenemos programadas para este mes?"
];

// Proactive notifications
const proactiveNotifications = [
  "¡Tengo información importante para ti! ¿Te gustaría conocer los nuevos beneficios disponibles en tu comuna?",
  "¡Buenas noticias! Hay nuevos talleres disponibles. ¿Te gustaría que te cuente más?",
  "¿Sabías que hay nuevos programas de apoyo disponibles? ¿Te gustaría conocer más detalles?",
]

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    const lowerMessage = message.toLowerCase().trim();

    // Find the best matching response
    let response = "Lo siento, no entiendo tu mensaje. ¿Podrías reformularlo?";
    let shouldPlayNotification = false;

    // Check for keywords in the message
    for (const [key, value] of Object.entries(responseMap)) {
      if (lowerMessage.includes(key)) {
        response = value;
        break;
      }
    }

    // If no specific response was found, provide a general response
    if (response === "Lo siento, no entiendo tu mensaje. ¿Podrías reformularlo?") {
      response = "Puedo ayudarte con información sobre beneficios, salud, actividades y apoyo social. ¿Qué te gustaría saber?";
    }

    // Randomly decide if we should show a proactive notification
    if (Math.random() < 0.3) { // 30% chance of showing a notification
      const randomIndex = Math.floor(Math.random() * proactiveNotifications.length);
      response = proactiveNotifications[randomIndex];
      shouldPlayNotification = true;
    }

    // Add a small delay to simulate processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({ 
      response,
      shouldPlayNotification 
    });
  } catch (error) {
    console.error("Error processing chat message:", error);
    return NextResponse.json(
      { error: "Error processing your message" },
      { status: 500 }
    );
  }
} 