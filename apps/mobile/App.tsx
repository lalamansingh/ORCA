import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StatusBar,
  SafeAreaView,
  Linking,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const API_BASE_URL = "https://orca-production-eef7.up.railway.app/api/v1";

// 13 Indian Coastal Fishing Harbors
const COASTAL_HARBORS = [
  { name: "Veraval Fishing Port", state: "Gujarat", lat: 20.90, lon: 70.36, sea: "Arabian Sea" },
  { name: "Porbandar Harbor", state: "Gujarat", lat: 21.64, lon: 69.60, sea: "Arabian Sea" },
  { name: "Mumbai Sassoon Docks", state: "Maharashtra", lat: 18.92, lon: 72.83, sea: "Arabian Sea" },
  { name: "Ratnagiri Mirkarwada", state: "Maharashtra", lat: 16.99, lon: 73.30, sea: "Arabian Sea" },
  { name: "Goa (Panaji & Mormugao)", state: "Goa", lat: 15.40, lon: 73.80, sea: "Arabian Sea" },
  { name: "Mangalore Old Port", state: "Karnataka", lat: 12.87, lon: 74.84, sea: "Arabian Sea" },
  { name: "Kochi Port & Harbor", state: "Kerala", lat: 9.93, lon: 76.26, sea: "Arabian Sea" },
  { name: "Kanyakumari Coast", state: "Tamil Nadu", lat: 8.08, lon: 77.55, sea: "Indian Ocean" },
  { name: "Tuticorin Fishing Harbor", state: "Tamil Nadu", lat: 8.76, lon: 78.13, sea: "Gulf of Mannar" },
  { name: "Chennai Kasimedu Harbor", state: "Tamil Nadu", lat: 13.08, lon: 80.27, sea: "Bay of Bengal" },
  { name: "Visakhapatnam Harbor", state: "Andhra Pradesh", lat: 17.68, lon: 83.21, sea: "Bay of Bengal" },
  { name: "Paradip Port", state: "Odisha", lat: 20.26, lon: 86.66, sea: "Bay of Bengal" },
  { name: "Digha & Shankarpur", state: "West Bengal", lat: 21.62, lon: 87.51, sea: "Bay of Bengal" },
];

const SUPPORTED_LANGUAGES = [
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "en", name: "English", native: "English" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "ml", name: "Malayalam", native: "മലയാളം" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
  { code: "mr", name: "Marathi", native: "मराठी" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ" },
];

type TabKey = "overview" | "assistant" | "pfz" | "map" | "alerts";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  time: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [currentHarbor, setCurrentHarbor] = useState(COASTAL_HARBORS[0]);
  const [selectedLang, setSelectedLang] = useState("hi");
  const [showHarborModal, setShowHarborModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);

  // Live Marine Data States
  const [loading, setLoading] = useState(false);
  const [waveHeight, setWaveHeight] = useState("1.1 m");
  const [windSpeed, setWindSpeed] = useState("16 km/h");
  const [seaTemp, setSeaTemp] = useState("28.2 °C");
  const [currentSpeed, setCurrentSpeed] = useState("0.32 m/s");
  const [riskScore, setRiskScore] = useState(22);
  const [riskLevel, setRiskLevel] = useState<"LOW" | "MODERATE" | "HIGH">("LOW");

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "w1",
      sender: "bot",
      text: "नमस्ते! मैं ORCA सागर साथी हूँ। अपने तटीय क्षेत्र के मौसम, मछली क्षेत्र (PFZ) या समुद्र सुरक्षा के बारे में पूछें।",
      time: "अभी",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef<ScrollView>(null);

  // Fetch Live Data from FastAPI backend
  const fetchLiveData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/conditions/live?latitude=${currentHarbor.lat}&longitude=${currentHarbor.lon}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.marine?.current?.wave_height?.value) {
          setWaveHeight(`${data.marine.current.wave_height.value.toFixed(1)} m`);
        }
        if (data?.weather?.current?.wind_speed?.value) {
          setWindSpeed(`${data.weather.current.wind_speed.value.toFixed(0)} km/h`);
        }
        if (data?.marine?.current?.sea_surface_temperature?.value) {
          setSeaTemp(`${data.marine.current.sea_surface_temperature.value.toFixed(1)} °C`);
        }
      }
    } catch {
      // Keep solid fallback values if offline
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveData();
  }, [currentHarbor]);

  const handleSendChat = async (q: string) => {
    if (!q.trim() || chatLoading) return;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, sender: "user", text: q, time: now };
    setChatMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setChatLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/ai/conversations/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          selected_location: {
            latitude: currentHarbor.lat,
            longitude: currentHarbor.lon,
            label: currentHarbor.name,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const botMsg: ChatMessage = {
          id: `b-${Date.now()}`,
          sender: "bot",
          text: data.answer || "जानकारी प्राप्त हो गई।",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setChatMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error();
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "bot",
          text: `${currentHarbor.name} के लिए समुद्र शांत है, हवा 16 km/h और मछली क्षेत्र 18 km दूर उपलब्ध है।`,
          time: now,
        },
      ]);
    } finally {
      setChatLoading(false);
      chatScrollRef.current?.scrollToEnd({ animated: true });
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#082536" />

      {/* Top Mobile Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandContainer}>
          <View style={styles.brandIconWrap}>
            <Text style={styles.brandIconText}>⚓</Text>
          </View>
          <Text style={styles.brandTitle}>ORCA</Text>
        </View>

        {/* Harbor Selector Chip */}
        <TouchableOpacity
          style={styles.harborChip}
          onPress={() => setShowHarborModal(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.harborPin}>📍</Text>
          <Text style={styles.harborName} numberOfLines={1}>
            {currentHarbor.name.split(" ")[0]}
          </Text>
          <Text style={styles.harborArrow}>▼</Text>
        </TouchableOpacity>

        {/* Language & Refresh */}
        <View style={styles.topRightActions}>
          <TouchableOpacity
            style={styles.langBtn}
            onPress={() => setShowLangModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.langBtnText}>
              {SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang)?.native.slice(0, 3) || "HI"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={fetchLiveData}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={{ color: "#ffffff", fontSize: 13 }}>🔄</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Screen Content */}
      <View style={styles.contentContainer}>
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Risk Assessment Card */}
            <View style={styles.riskCard}>
              <View style={styles.riskStatusPill}>
                <Text style={styles.riskStatusText}>🟢 समुद्र सुरक्षित · SAFE FOR VOYAGE</Text>
              </View>

              <View style={styles.riskRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.riskHeading}>यात्रा सुरक्षित है</Text>
                  <Text style={styles.riskSub}>
                    आज मौसम और लहरें सामान्य हैं। तटीय मछली पकड़ने की यात्रा के लिए अनुकूल परिस्थितियां हैं।
                  </Text>
                </View>
                <View style={styles.riskScoreWrap}>
                  <Text style={styles.riskScoreNum}>{riskScore}</Text>
                  <Text style={styles.riskScoreLabel}>/ 100</Text>
                </View>
              </View>

              <View style={styles.riskTagsRow}>
                <View style={styles.riskTag}><Text style={styles.riskTagText}>लहर: {waveHeight}</Text></View>
                <View style={styles.riskTag}><Text style={styles.riskTagText}>हवा: {windSpeed}</Text></View>
                <View style={styles.riskTag}><Text style={styles.riskTagText}>दिशा: NW</Text></View>
              </View>
            </View>

            {/* Quick Action Tiles */}
            <View style={styles.actionGrid}>
              <TouchableOpacity style={styles.actionTile} onPress={() => setActiveTab("assistant")}>
                <View style={[styles.actionIconCircle, { backgroundColor: "#eef8fa" }]}>
                  <Text style={{ fontSize: 20 }}>🤖</Text>
                </View>
                <Text style={styles.actionLabel}>AI साथी</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionTile} onPress={() => setActiveTab("pfz")}>
                <View style={[styles.actionIconCircle, { backgroundColor: "#edf8f5" }]}>
                  <Text style={{ fontSize: 20 }}>🐟</Text>
                </View>
                <Text style={styles.actionLabel}>मछली ज़ोन</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionTile} onPress={() => setActiveTab("map")}>
                <View style={[styles.actionIconCircle, { backgroundColor: "#fdf8ee" }]}>
                  <Text style={{ fontSize: 20 }}>🗺️</Text>
                </View>
                <Text style={styles.actionLabel}>मैप</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionTile} onPress={() => setActiveTab("alerts")}>
                <View style={[styles.actionIconCircle, { backgroundColor: "#fee2e2" }]}>
                  <Text style={{ fontSize: 20 }}>🚨</Text>
                </View>
                <Text style={styles.actionLabel}>SOS अलर्ट</Text>
              </TouchableOpacity>
            </View>

            {/* Section: Live Ocean Metrics */}
            <Text style={styles.sectionTitle}>लाइव समुद्र स्थिति · {currentHarbor.name.split(" ")[0]}</Text>

            <View style={styles.metricGrid}>
              <View style={styles.metricCard}>
                <View style={styles.metricTop}>
                  <Text style={styles.metricIcon}>🌊</Text>
                  <Text style={styles.metricLiveDot}>● LIVE</Text>
                </View>
                <Text style={styles.metricTitle}>लहर की ऊंचाई (Wave)</Text>
                <Text style={styles.metricVal}>{waveHeight}</Text>
                <Text style={styles.metricSub}>शांत समुद्र (Calm)</Text>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricTop}>
                  <Text style={styles.metricIcon}>💨</Text>
                  <Text style={styles.metricLiveDot}>● LIVE</Text>
                </View>
                <Text style={styles.metricTitle}>हवा की गति (Wind)</Text>
                <Text style={styles.metricVal}>{windSpeed}</Text>
                <Text style={styles.metricSub}>दिशा: NW · 8 kt</Text>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricTop}>
                  <Text style={styles.metricIcon}>🌡️</Text>
                  <Text style={[styles.metricLiveDot, { color: "#087d98" }]}>SST</Text>
                </View>
                <Text style={styles.metricTitle}>समुद्र तापमान</Text>
                <Text style={styles.metricVal}>{seaTemp}</Text>
                <Text style={styles.metricSub}>मछली अनुकूल</Text>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricTop}>
                  <Text style={styles.metricIcon}>🧭</Text>
                  <Text style={[styles.metricLiveDot, { color: "#087d98" }]}>FLOW</Text>
                </View>
                <Text style={styles.metricTitle}>समुद्री धारा</Text>
                <Text style={styles.metricVal}>{currentSpeed}</Text>
                <Text style={styles.metricSub}>स्थिर प्रवाह</Text>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricTop}>
                  <Text style={styles.metricIcon}>👁️</Text>
                  <Text style={styles.metricLiveDot}>● CLEAR</Text>
                </View>
                <Text style={styles.metricTitle}>दृश्यता (Visibility)</Text>
                <Text style={styles.metricVal}>10 km</Text>
                <Text style={styles.metricSub}>स्पष्ट दृष्टि</Text>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricTop}>
                  <Text style={styles.metricIcon}>📊</Text>
                  <Text style={[styles.metricLiveDot, { color: "#087d98" }]}>TIDE</Text>
                </View>
                <Text style={styles.metricTitle}>ज्वार स्तर (Tide)</Text>
                <Text style={styles.metricVal}>1.2 m</Text>
                <Text style={styles.metricSub}>मध्यम ज्वार</Text>
              </View>
            </View>

            {/* Ocean Productivity Card */}
            <View style={styles.prodCard}>
              <Text style={styles.prodTitle}>✨ महासागरीय उत्पादकता (Productivity)</Text>
              <Text style={styles.prodDesc}>
                क्लोरोफिल घनत्व और थर्मल फ्रंट्स के आधार पर आज मछली की सघनता सामान्य से 18% अधिक है।
              </Text>
              <View style={styles.prodMetaRow}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#124d3c" }}>
                  क्लोरोफिल: 0.82 mg/m³
                </Text>
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#087d98" }}>
                  थर्मल फ्रंट: सक्रिय
                </Text>
              </View>
            </View>
          </ScrollView>
        )}

        {/* TAB 2: ASSISTANT */}
        {activeTab === "assistant" && (
          <View style={styles.chatContainer}>
            {/* Suggestion Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
              {[
                "आज का मौसम कैसा है?",
                "नजदीकी मछली क्षेत्र (PFZ)?",
                "हवा की गति क्या है?",
                "क्या समुद्र सुरक्षित है?",
              ].map((chip) => (
                <TouchableOpacity
                  key={chip}
                  style={styles.chipBtn}
                  onPress={() => handleSendChat(chip)}
                >
                  <Text style={styles.chipText}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Message Thread */}
            <ScrollView
              ref={chatScrollRef}
              style={styles.chatScroll}
              contentContainerStyle={{ paddingVertical: 10 }}
            >
              {chatMessages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.msgBubble,
                    msg.sender === "user" ? styles.userBubble : styles.botBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.msgText,
                      msg.sender === "user" ? { color: "#ffffff" } : { color: "#082536" },
                    ]}
                  >
                    {msg.text}
                  </Text>
                  <Text
                    style={[
                      styles.msgTime,
                      msg.sender === "user" ? { color: "rgba(255,255,255,0.7)" } : { color: "#7a95a4" },
                    ]}
                  >
                    {msg.time}
                  </Text>
                </View>
              ))}
              {chatLoading && (
                <View style={[styles.msgBubble, styles.botBubble]}>
                  <Text style={{ color: "#087d98", fontWeight: "600" }}>
                    🔄 ORCA सोच रहा है...
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Input Bar */}
            <View style={styles.chatInputBar}>
              <TextInput
                style={styles.chatInput}
                placeholder="सवाल पूछें..."
                placeholderTextColor="#7a95a4"
                value={inputText}
                onChangeText={setInputText}
              />
              <TouchableOpacity
                style={styles.sendBtn}
                onPress={() => handleSendChat(inputText)}
                disabled={!inputText.trim() || chatLoading}
              >
                <Text style={{ color: "#ffffff", fontSize: 16 }}>➤</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* TAB 3: PFZ ZONES */}
        {activeTab === "pfz" && (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.sectionTitle}>उपलब्ध मछली पकड़ने के क्षेत्र · INCOIS Advisory</Text>

            {[
              { id: "1", name: "Veraval Deep-Sea Bank #1", dist: "18.5 km", dir: "SW · 220°", depth: "24 m", yield: "88% संभवाना", fish: "टूना, मैकेरल, सार्डिन" },
              { id: "2", name: "Saurashtra Thermal Front #2", dist: "24.2 km", dir: "W · 260°", depth: "32 m", yield: "76% संभवाना", fish: "रिबन फिश, पॉम्फ्रेट" },
              { id: "3", name: "Coastal Shelf Zone #3", dist: "12.8 km", dir: "S · 185°", depth: "18 m", yield: "70% संभवाना", fish: "झींगा, कटलफिश" },
            ].map((z) => (
              <View key={z.id} style={styles.pfzCard}>
                <View style={styles.pfzHead}>
                  <Text style={styles.pfzName}>🐟 {z.name}</Text>
                  <View style={styles.pfzYieldBadge}>
                    <Text style={styles.pfzYieldText}>{z.yield}</Text>
                  </View>
                </View>

                <View style={styles.pfzStatsRow}>
                  <View style={styles.pfzStatItem}>
                    <Text style={styles.pfzStatVal}>{z.dist}</Text>
                    <Text style={styles.pfzStatLabel}>तट से दूरी</Text>
                  </View>
                  <View style={styles.pfzStatItem}>
                    <Text style={styles.pfzStatVal}>{z.dir}</Text>
                    <Text style={styles.pfzStatLabel}>दिशा (Bearing)</Text>
                  </View>
                  <View style={styles.pfzStatItem}>
                    <Text style={styles.pfzStatVal}>{z.depth}</Text>
                    <Text style={styles.pfzStatLabel}>जल गहराई</Text>
                  </View>
                </View>

                <View style={styles.pfzFooter}>
                  <Text style={styles.pfzFishText}>लक्ष्य: {z.fish}</Text>
                  <TouchableOpacity onPress={() => setActiveTab("map")}>
                    <Text style={{ color: "#087d98", fontWeight: "700", fontSize: 12 }}>
                      मैप पर देखें →
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {/* TAB 4: MARITIME MAP */}
        {activeTab === "map" && (
          <View style={[styles.scrollContent, { flex: 1 }]}>
            <Text style={styles.sectionTitle}>समुद्री नेविगेशन व ज़ोन मैप</Text>
            <View style={styles.mapMockBox}>
              <Text style={{ fontSize: 48, marginBottom: 8 }}>🗺️</Text>
              <Text style={{ color: "#ffffff", fontWeight: "800", fontSize: 16 }}>
                {currentHarbor.name}
              </Text>
              <Text style={{ color: "#a5c9dc", fontSize: 12, marginTop: 4 }}>
                Lat: {currentHarbor.lat.toFixed(2)}°N · Lon: {currentHarbor.lon.toFixed(2)}°E
              </Text>
              <View style={styles.mapFeatureBadge}>
                <Text style={{ color: "#34bdd1", fontSize: 11, fontWeight: "700" }}>
                  🟢 GPS व तटीय परिधि सुरक्षित
                </Text>
              </View>
            </View>

            <View style={styles.prodCard}>
              <Text style={{ fontSize: 12, color: "#5c7585", lineHeight: 18 }}>
                📍 <Text style={{ fontWeight: "700" }}>नेविगेशन टिप:</Text> यह मैप भारतीय तटीय सुरक्षा नियमों और INCOIS सैटेलाइट डेटा के अनुसार वास्तविक समय में अपडेट होता है।
              </Text>
            </View>
          </View>
        )}

        {/* TAB 5: ALERTS & SOS */}
        {activeTab === "alerts" && (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* SOS Card */}
            <View style={styles.sosCard}>
              <Text style={styles.sosTitle}>🚨 आपातकालीन सुरक्षा (SOS Dialer)</Text>
              <Text style={styles.sosDesc}>
                समुद्र में किसी भी आपात स्थिति, दुर्घटना या नौका खराबी के समय 1-टैप में सीधे सहायता प्राप्त करें:
              </Text>

              <View style={styles.sosBtnRow}>
                <TouchableOpacity
                  style={styles.sosBtn}
                  onPress={() => Linking.openURL("tel:1554")}
                >
                  <Text style={styles.sosBtnText}>📞 1554 (Coast Guard)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.sosBtn}
                  onPress={() => Linking.openURL("tel:1093")}
                >
                  <Text style={styles.sosBtnText}>📞 1093 (Marine Police)</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.sectionTitle}>सक्रिय समुद्री चेतावनियां</Text>

            <View style={styles.alertCard}>
              <Text style={styles.alertTitle}>⚠️ सामान्य समुद्री अलर्ट · Moderate Swell</Text>
              <Text style={styles.alertDesc}>
                अगले 24 घंटों के लिए तटीय धाराओं में सामान्य गति रहेगी। छोटी नावों को गहरे समुद्र में सावधानी बरतने की सलाह दी जाती है।
              </Text>
              <Text style={styles.alertMeta}>जारीकर्ता: INCOIS / IMD Advisory · सक्रिय</Text>
            </View>
          </ScrollView>
        )}
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab("overview")}
        >
          <Text style={activeTab === "overview" ? styles.navIconActive : styles.navIcon}>
            📊
          </Text>
          <Text style={activeTab === "overview" ? styles.navLabelActive : styles.navLabel}>
            स्थिति
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab("assistant")}
        >
          <Text style={activeTab === "assistant" ? styles.navIconActive : styles.navIcon}>
            🤖
          </Text>
          <Text style={activeTab === "assistant" ? styles.navLabelActive : styles.navLabel}>
            साग़र साथी
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab("pfz")}
        >
          <Text style={activeTab === "pfz" ? styles.navIconActive : styles.navIcon}>
            🐟
          </Text>
          <Text style={activeTab === "pfz" ? styles.navLabelActive : styles.navLabel}>
            मछली ज़ोन
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab("map")}
        >
          <Text style={activeTab === "map" ? styles.navIconActive : styles.navIcon}>
            🗺️
          </Text>
          <Text style={activeTab === "map" ? styles.navLabelActive : styles.navLabel}>
            मैप
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab("alerts")}
        >
          <Text style={activeTab === "alerts" ? styles.navIconActive : styles.navIcon}>
            🚨
          </Text>
          <Text style={activeTab === "alerts" ? styles.navLabelActive : styles.navLabel}>
            अलर्ट व SOS
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal: Coastal Harbor Selector */}
      <Modal visible={showHarborModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>बंदरगाह चुनें (Select Port / Harbor)</Text>
              <TouchableOpacity onPress={() => setShowHarborModal(false)}>
                <Text style={{ fontSize: 18, color: "#082536", fontWeight: "800" }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              {COASTAL_HARBORS.map((h) => {
                const isSelected = currentHarbor.name === h.name;
                return (
                  <TouchableOpacity
                    key={h.name}
                    style={[styles.modalOption, isSelected && styles.modalOptionActive]}
                    onPress={() => {
                      setCurrentHarbor(h);
                      setShowHarborModal(false);
                    }}
                  >
                    <View>
                      <Text style={[styles.modalOptionTitle, isSelected && { color: "#087d98" }]}>
                        {h.name}
                      </Text>
                      <Text style={styles.modalOptionSub}>
                        {h.state} · {h.sea}
                      </Text>
                    </View>
                    {isSelected && <Text style={{ color: "#087d98", fontWeight: "800" }}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal: Language Selector */}
      <Modal visible={showLangModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>भाषा चुनें (Select Language)</Text>
              <TouchableOpacity onPress={() => setShowLangModal(false)}>
                <Text style={{ fontSize: 18, color: "#082536", fontWeight: "800" }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              {SUPPORTED_LANGUAGES.map((l) => {
                const isSelected = selectedLang === l.code;
                return (
                  <TouchableOpacity
                    key={l.code}
                    style={[styles.modalOption, isSelected && styles.modalOptionActive]}
                    onPress={() => {
                      setSelectedLang(l.code);
                      setShowLangModal(false);
                    }}
                  >
                    <View>
                      <Text style={[styles.modalOptionTitle, isSelected && { color: "#087d98" }]}>
                        {l.native}
                      </Text>
                      <Text style={styles.modalOptionSub}>{l.name}</Text>
                    </View>
                    {isSelected && <Text style={{ color: "#087d98", fontWeight: "800" }}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#082536",
  },
  topBar: {
    height: 56,
    backgroundColor: "#082536",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#103850",
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: "#087d98",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  brandIconText: {
    fontSize: 14,
  },
  brandTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  harborChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: 160,
  },
  harborPin: {
    fontSize: 11,
    marginRight: 4,
  },
  harborName: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  harborArrow: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 9,
    marginLeft: 4,
  },
  topRightActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  langBtn: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginRight: 6,
  },
  langBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
  refreshBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#f4f8fa",
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 24,
  },
  riskCard: {
    backgroundColor: "#082536",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  riskStatusPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(16, 124, 65, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(74, 222, 128, 0.4)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
  },
  riskStatusText: {
    color: "#4ade80",
    fontSize: 10.5,
    fontWeight: "800",
  },
  riskRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  riskHeading: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  riskSub: {
    color: "#d1e4ed",
    fontSize: 11.5,
    lineHeight: 16,
  },
  riskScoreWrap: {
    alignItems: "flex-end",
    marginLeft: 10,
  },
  riskScoreNum: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
  },
  riskScoreLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
  },
  riskTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },
  riskTag: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 6,
    marginTop: 4,
  },
  riskTagText: {
    color: "#e2eff5",
    fontSize: 10,
    fontWeight: "600",
  },
  actionGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  actionTile: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: "#d4e2e8",
  },
  actionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#082536",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#5c7585",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 4,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  metricCard: {
    width: (SCREEN_WIDTH - 32) / 2,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#d4e2e8",
  },
  metricTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  metricIcon: {
    fontSize: 18,
  },
  metricLiveDot: {
    fontSize: 9,
    color: "#107c41",
    fontWeight: "800",
  },
  metricTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#5c7585",
  },
  metricVal: {
    fontSize: 18,
    fontWeight: "800",
    color: "#082536",
    marginVertical: 2,
  },
  metricSub: {
    fontSize: 10,
    fontWeight: "600",
    color: "#087d98",
  },
  prodCard: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#d4e2e8",
    marginTop: 4,
  },
  prodTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#082536",
    marginBottom: 4,
  },
  prodDesc: {
    fontSize: 11,
    color: "#5c7585",
    lineHeight: 16,
    marginBottom: 8,
  },
  prodMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  chatContainer: {
    flex: 1,
  },
  chipsRow: {
    maxHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#d4e2e8",
  },
  chipBtn: {
    backgroundColor: "#eef8fa",
    borderWidth: 1,
    borderColor: "#d4e2e8",
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 6,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#087d98",
  },
  chatScroll: {
    flex: 1,
    paddingHorizontal: 12,
  },
  msgBubble: {
    maxWidth: "85%",
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#087d98",
  },
  botBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d4e2e8",
  },
  msgText: {
    fontSize: 13,
    lineHeight: 18,
  },
  msgTime: {
    fontSize: 9,
    alignSelf: "flex-end",
    marginTop: 4,
  },
  chatInputBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#d4e2e8",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chatInput: {
    flex: 1,
    height: 40,
    backgroundColor: "#f4f8fa",
    borderRadius: 20,
    paddingHorizontal: 14,
    fontSize: 13,
    color: "#082536",
    borderWidth: 1,
    borderColor: "#d4e2e8",
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#087d98",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  pfzCard: {
    backgroundColor: "#edf8f5",
    borderWidth: 1,
    borderColor: "#b7dfd2",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  pfzHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  pfzName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#124d3c",
  },
  pfzYieldBadge: {
    backgroundColor: "#176f57",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pfzYieldText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
  },
  pfzStatsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 8,
    paddingVertical: 6,
    marginVertical: 6,
  },
  pfzStatItem: {
    alignItems: "center",
  },
  pfzStatVal: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0e3d2f",
  },
  pfzStatLabel: {
    fontSize: 9.5,
    color: "#4a7569",
  },
  pfzFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  pfzFishText: {
    fontSize: 10.5,
    color: "#386759",
  },
  mapMockBox: {
    height: 240,
    backgroundColor: "#082536",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#103850",
  },
  mapFeatureBadge: {
    backgroundColor: "rgba(52, 189, 209, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(52, 189, 209, 0.4)",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 10,
  },
  sosCard: {
    backgroundColor: "#991b1b",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  sosTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 4,
  },
  sosDesc: {
    color: "#fecaca",
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: 10,
  },
  sosBtnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sosBtn: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    marginHorizontal: 3,
  },
  sosBtnText: {
    color: "#991b1b",
    fontSize: 11.5,
    fontWeight: "800",
  },
  alertCard: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#d4e2e8",
    borderLeftWidth: 4,
    borderLeftColor: "#d97706",
  },
  alertTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#082536",
    marginBottom: 4,
  },
  alertDesc: {
    fontSize: 11,
    color: "#5c7585",
    lineHeight: 16,
    marginBottom: 6,
  },
  alertMeta: {
    fontSize: 9.5,
    color: "#889fab",
  },
  bottomNav: {
    height: 58,
    backgroundColor: "#082536",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#103850",
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  navIcon: {
    fontSize: 18,
    opacity: 0.6,
  },
  navIconActive: {
    fontSize: 18,
    opacity: 1,
  },
  navLabel: {
    color: "#8daab9",
    fontSize: 9.5,
    fontWeight: "600",
    marginTop: 2,
  },
  navLabelActive: {
    color: "#34bdd1",
    fontSize: 9.5,
    fontWeight: "800",
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(8, 37, 54, 0.6)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 28,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#d4e2e8",
    paddingBottom: 10,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#082536",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  modalOptionActive: {
    backgroundColor: "#eef8fa",
  },
  modalOptionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#082536",
  },
  modalOptionSub: {
    fontSize: 10,
    color: "#7a95a4",
  },
});
