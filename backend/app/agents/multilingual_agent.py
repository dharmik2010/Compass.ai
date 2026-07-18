import asyncio
from typing import Dict, Any, List, Optional
from ..config import settings


LANGUAGE_MAP = {
    "en": "English", "es": "Spanish", "fr": "French", "de": "German",
    "it": "Italian", "pt": "Portuguese", "ja": "Japanese", "ko": "Korean",
    "zh": "Chinese", "ar": "Arabic", "hi": "Hindi", "ru": "Russian",
    "th": "Thai", "vi": "Vietnamese", "tr": "Turkish", "nl": "Dutch",
}

EMERGENCY_PHRASES = {
    "en": {"help": "Help!", "police": "Call the police!", "hospital": "Take me to the hospital!", "lost": "I am lost."},
    "es": {"help": "¡Ayuda!", "police": "¡Llame a la policía!", "hospital": "¡Lléveme al hospital!", "lost": "Estoy perdido."},
    "fr": {"help": "Au secours!", "police": "Appelez la police!", "hospital": "Emmenez-moi à l'hôpital!", "lost": "Je suis perdu."},
    "ja": {"help": "助けて！", "police": "警察を呼んで！", "hospital": "病院に連れて行って！", "lost": "道に迷いました。"},
    "ko": {"help": "도와주세요!", "police": "경찰을 불러주세요!", "hospital": "병원에 데려가 주세요!", "lost": "길을 잃었습니다."},
    "zh": {"help": "救命！", "police": "报警！", "hospital": "带我去医院！", "lost": "我迷路了。"},
    "hi": {"help": "मदद करें!", "police": "पुलिस को बुलाओ!", "hospital": "मुझे अस्पताल ले चलो!", "lost": "मैं खो गया हूं।"},
    "th": {"help": "ช่วยด้วย!", "police": "เรียกตำรวจ!", "hospital": "พาฉันไปโรงพยาบาล!", "lost": "ฉันหลงทาง"},
}


class MultiLingualInteractionAgent:
    def __init__(self):
        self._llm = None

    def _get_llm(self):
        if self._llm is None and settings.openai_api_key:
            from langchain_openai import ChatOpenAI
            self._llm = ChatOpenAI(
                model=settings.openai_model,
                temperature=0.1,
                api_key=settings.openai_api_key,
            )
        return self._llm

    async def translate(self, text: str, target_lang: str, source_lang: str = "en") -> str:
        llm = self._get_llm()
        if target_lang == source_lang or not llm:
            return text

        target_name = LANGUAGE_MAP.get(target_lang, target_lang)
        source_name = LANGUAGE_MAP.get(source_lang, source_lang)

        from langchain_core.messages import HumanMessage
        msg = HumanMessage(
            content=(
                f"Translate the following text from {source_name} to {target_name}.\n"
                "Return ONLY the translation, no explanations.\n\n"
                f"{text}"
            )
        )
        response = await llm.ainvoke([msg])
        return response.content.strip()

    async def translate_itinerary(self, itinerary_text: str, target_lang: str) -> str:
        llm = self._get_llm()
        if target_lang == "en" or not llm:
            return itinerary_text

        target_name = LANGUAGE_MAP.get(target_lang, target_lang)

        from langchain_core.messages import SystemMessage, HumanMessage
        system = SystemMessage(
            content=(
                f"You are a professional travel document translator. "
                f"Translate the following travel itinerary to {target_name}. "
                f"Preserve all formatting, dates, numbers, prices, URLs, and proper nouns. "
                f"Only translate descriptive text."
            )
        )
        msg = HumanMessage(content=itinerary_text[:6000])
        response = await llm.ainvoke([system, msg])
        return response.content.strip()

    def get_emergency_phrases(self, lang: str) -> Dict[str, str]:
        return EMERGENCY_PHRASES.get(lang, EMERGENCY_PHRASES["en"])

    async def handle_disruption(
        self,
        disruption_type: str,
        details: str,
        user_lang: str = "en",
    ) -> Dict[str, Any]:
        target_name = LANGUAGE_MAP.get(user_lang, "English")
        llm = self._get_llm()

        disruptions = {
            "flight_cancellation": {
                "actions": [
                    "Contact the airline counter immediately for rebooking.",
                    "Check alternative flights on competing airlines.",
                    "Request compensation if applicable under EU261 / local regulations.",
                    "Do not leave the airport until rebooked.",
                ],
            },
            "flight_delay": {
                "actions": [
                    "Stay near your gate and monitor flight boards.",
                    "If delay > 2 hours, request meal vouchers from the airline.",
                    "If delay > 5 hours, request hotel accommodation.",
                    "Check if you qualify for compensation.",
                ],
            },
            "lost_luggage": {
                "actions": [
                    "Go to the baggage services desk immediately.",
                    "File a Property Irregularity Report (PIR).",
                    "Request a temporary essentials kit if available.",
                    "Keep all receipts for emergency purchases.",
                ],
            },
            "hotel_overbooking": {
                "actions": [
                    "Demand the hotel arrange alternative accommodation at their cost.",
                    "Request transportation to the alternative hotel.",
                    "Ask for compensation (free night or upgrade on return).",
                    "Do not accept a lower standard room category.",
                ],
            },
            "medical_emergency": {
                "actions": [
                    "Call local emergency services immediately.",
                    "Contact your travel insurance provider.",
                    "Notify your hotel concierge for assistance.",
                    "Keep your insurance card and passport accessible.",
                ],
            },
            "general": {
                "actions": [
                    "Stay calm and assess the situation.",
                    "Contact your travel insurance provider.",
                    "Notify your accommodation.",
                    "Keep digital copies of all documents accessible.",
                ],
            },
        }

        info = disruptions.get(disruption_type, disruptions["general"])
        message = details or f"Disruption: {disruption_type.replace('_', ' ')}"

        actions_translated = []
        for action in info["actions"]:
            translation = await self.translate(action, user_lang) if llm else action
            actions_translated.append(translation)

        translated_message = await self.translate(message, user_lang) if llm else message

        return {
            "disruption_type": disruption_type,
            "message": message,
            "translated_message": translated_message,
            "recommended_actions": actions_translated,
            "emergency_phrases": self.get_emergency_phrases(user_lang),
            "language": target_name,
        }

    async def local_voice_narration(self, text: str, lang: str = "en") -> Dict[str, str]:
        return {
            "text": text,
            "language": LANGUAGE_MAP.get(lang, "English"),
            "ssml": f"<speak><lang xml:lang='{lang}'>{text}</lang></speak>",
            "narration_available": True,
        }


multilingual_agent = MultiLingualInteractionAgent()
