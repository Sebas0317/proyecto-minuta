import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  X,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Bot,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { queryChatbot } from '../services/api';

// Web Audio API sintetizador de sonido para respuestas
function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    // AudioContext silenciado
  }
}

const INITIAL_SUGGESTIONS = [
  '📝 Radicar PQRS',
  '📋 Estado de mi PQRS',
  '🏊 Horario Piscina',
  '🏋️ Gimnasio & Aforo',
  '🗑️ Día de Basuras',
  '💳 Cuentas de Pago',
  '📦 Tengo Paquete?',
  '🚗 Cupos Parqueadero',
  '🔇 Horario de Silencio',
  '🚨 Emergencias 24/7'
];

export default function MinutaBotWidget() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [context, setContext] = useState({});

  const [messages, setMessages] = useState([
    {
      id: 'welcome-msg',
      sender: 'bot',
      text: '¡Hola! 👋 Soy **MinutaBot**, tu asistente virtual del condominio.\n\nPuedes consultarme sobre horarios de zonas comunes, rutas de aseo, basuras, manual de convivencia, cuentas bancarias o verificar en tiempo real si tienes paquetes en portería.\n\n¿En qué te puedo colaborar?',
      suggestions: INITIAL_SUGGESTIONS,
      timestamp: new Date()
    }
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'es-CO';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(transcript);
          handleSend(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.info('Reconocimiento de voz no soportado en este navegador');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast.info('Escuchando... Di tu pregunta');
      } catch (e) {
        setIsListening(false);
      }
    }
  };

  const speakText = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#`]/g, '').replace(/https?:\/\/\S+/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-CO';
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copiado al portapapeles');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async (userText) => {
    const query = (userText || input).trim();
    if (!query || loading) return;

    const userMsgId = 'usr-' + Date.now();
    const newMsg = {
      id: userMsgId,
      sender: 'user',
      text: query,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, newMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await queryChatbot(query, context);
      if (res.context) {
        setContext(res.context);
      }
      const botMsgId = 'bot-' + Date.now();
      const botMsg = {
        id: botMsgId,
        sender: 'bot',
        text: res.answer || 'No encontré información exacta para tu consulta.',
        action: res.item?.accionRapida || res.accionRapida || null,
        suggestions: res.suggestions || INITIAL_SUGGESTIONS.slice(0, 4),
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, botMsg]);

      if (soundEnabled) {
        playChime();
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          sender: 'bot',
          text: 'Ocurrió un error al consultar el asistente. Por favor intenta de nuevo o comunícate con portería a la **Ext. 100**.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (sug) => {
    const clean = sug.replace(/^[\u{1F300}-\u{1FAFF}\s]+/gu, '').trim();
    handleSend(clean);
  };

  const resetChat = () => {
    setMessages([
      {
        id: 'welcome-msg',
        sender: 'bot',
        text: '¡Conversación reiniciada! ¿En qué otra consulta te puedo colaborar hoy?',
        suggestions: INITIAL_SUGGESTIONS,
        timestamp: new Date()
      }
    ]);
  };

  const formatBotText = (txt) => {
    return txt.split('\n').map((line, idx) => {
      const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em>$1</em>')
                            .replace(/```(.*?)```/g, '<code class="bg-slate-900 px-1 py-0.5 rounded text-emerald-400 font-mono text-[11px]">$1</code>')
                            .replace(/`(.*?)`/g, '<code class="bg-slate-900 px-1 py-0.5 rounded text-emerald-400 font-mono text-[11px]">$1</code>');

      return (
        <p
          key={idx}
          className={line.startsWith('•') ? 'ml-2 my-0.5' : 'my-1'}
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      );
    });
  };

  return (
    <>
      {/* BOTÓN FLOTANTE TRIGGER */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-2xl shadow-emerald-950/80 transition-all hover:scale-105 active:scale-95 group border border-emerald-400/30"
          aria-label="Abrir Asistente Virtual"
        >
          <div className="relative">
            <Bot className="w-6 h-6 animate-bounce" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full" />
          </div>
          <div className="hidden sm:block text-left">
            <span className="block text-xs font-black tracking-wide leading-none">MinutaBot</span>
            <span className="text-[10px] text-emerald-200 leading-none">Asistente Virtual 24/7</span>
          </div>
        </button>
      )}

      {/* VENTANA DEL CHATBOT */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-[95vw] sm:w-[410px] h-[580px] max-h-[88vh] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* HEADER */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl relative">
                <Bot className="w-6 h-6" />
                <span className="absolute bottom-0.5 right-0.5 w-2 h-2 bg-emerald-400 rounded-full" />
              </div>
              <div>
                <h3 className="font-black text-white text-sm flex items-center gap-1.5">
                  MinutaBot P.H.
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    IA Local
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  En línea • Respuestas Inmediatas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Silenciar sonidos' : 'Activar sonidos'}
                className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              </button>

              <button
                onClick={resetChat}
                title="Reiniciar chat"
                className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                title="Cerrar"
                className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* CUERPO DE MENSAJES */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/70 text-xs text-slate-200 scrollbar-thin scrollbar-thumb-slate-700">
            {messages.map((m) => {
              const isBot = m.sender === 'bot';
              return (
                <div key={m.id} className={`flex flex-col ${isBot ? 'items-start' : 'items-end'} space-y-1`}>
                  <div
                    className={`max-w-[88%] p-3.5 rounded-2xl shadow-md ${
                      isBot
                        ? 'bg-slate-900 border border-slate-700 text-slate-200 rounded-tl-sm'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-sm font-medium'
                    }`}
                  >
                    <div className="leading-relaxed">
                      {isBot ? formatBotText(m.text) : m.text}
                    </div>

                    {/* BOTÓN DE ACCIÓN RÁPIDA VINCULADA */}
                    {isBot && m.action?.ruta && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800 flex justify-end">
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            navigate(m.action.ruta);
                          }}
                          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl font-bold text-[11px] shadow transition-all"
                        >
                          <span>{m.action.label || 'Ver Más'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* BARRA DE HERRAMIENTAS POR MENSAJE BOT */}
                  {isBot && (
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 pl-1">
                      <button
                        onClick={() => speakText(m.text)}
                        className="hover:text-emerald-400 flex items-center gap-1 transition-colors"
                        title="Escuchar en voz alta"
                      >
                        <Volume2 className="w-3 h-3" /> Escuchar
                      </button>
                      <span>•</span>
                      <button
                        onClick={() => handleCopy(m.id, m.text)}
                        className="hover:text-emerald-400 flex items-center gap-1 transition-colors"
                        title="Copiar texto"
                      >
                        {copiedId === m.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedId === m.id ? 'Copiado' : 'Copiar'}
                      </button>
                    </div>
                  )}

                  {/* CHIPS DE SUGERENCIA SI EXISTEN */}
                  {isBot && m.suggestions?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2 max-w-[95%]">
                      {m.suggestions.map((sug, i) => (
                        <button
                          key={i}
                          onClick={() => handleSuggestionClick(sug)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all hover:scale-105 active:scale-95 text-left"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* INDICADOR DE ESCRITURA */}
            {loading && (
              <div className="flex items-center gap-2 text-slate-400 bg-slate-900 border border-slate-700 w-fit p-3 rounded-2xl">
                <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
                <span className="text-xs">MinutaBot está consultando la información...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* INPUT FORM */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-slate-900 border-t border-slate-700 flex items-center gap-2"
          >
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2.5 rounded-xl border transition-all ${
                isListening
                  ? 'bg-red-500 text-white border-red-400 animate-pulse'
                  : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
              }`}
              title="Dictar por voz"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregúntame algo (ej: horario piscina, basuras)..."
              className="flex-1 bg-slate-950 border border-slate-700 text-white px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-emerald-500 transition-all placeholder:text-slate-500"
            />

            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white rounded-xl shadow-md transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}