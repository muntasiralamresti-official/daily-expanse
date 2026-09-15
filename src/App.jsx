import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { NavigationContainer, DefaultTheme, useNavigation } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import {
  Home,
  List,
  PieChart,
  Settings,
  Plus,
  Wallet,
  TrendingUp,
  TrendingDown,
  Search,
  Target,
  CalendarDays,
  SlidersHorizontal,
} from "lucide-react-native";
import { seedDatabase } from "./database/db";
import { addTransaction, deleteTransaction, getTransactions } from "./services/transactionService";
import { getCategories, getPaymentMethods } from "./services/dataService";
import { getMonthlyBudget, monthKey, setMonthlyBudget } from "./services/budgetService";

const colors = {
  bg: "#f8fafc",
  card: "#ffffff",
  text: "#0f172a",
  muted: "#64748b",
  primary: "#2563eb",
  border: "#e2e8f0",
  green: "#16a34a",
  red: "#dc2626",
  amber: "#d97706",
};
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const money = (n) => `৳ ${Number(n || 0).toLocaleString("en-IN")}`;
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const sameMonth = (timestamp, key = monthKey()) => monthKey(timestamp) === key;

function Dashboard() {
  const navigation = useNavigation();
  const [txs, setTxs] = useState([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [monthSummary, setMonthSummary] = useState({ income: 0, expense: 0 });
  const [budget, setBudget] = useState(0);

  const load = async () => {
    const data = await getTransactions();
    let income = 0;
    let expense = 0;
    let monthIncome = 0;
    let monthExpense = 0;
    data.forEach((t) => {
      const amount = Number(t.amount) || 0;
      if (t.type === "income") income += amount;
      else expense += amount;
      if (sameMonth(t.date)) {
        if (t.type === "income") monthIncome += amount;
        else monthExpense += amount;
      }
    });
    setSummary({ income, expense, balance: income - expense });
    setMonthSummary({ income: monthIncome, expense: monthExpense });
    setBudget(await getMonthlyBudget());
    setTxs(data.sort((a, b) => b.date - a.date).slice(0, 5));
  };

  useEffect(() => {
    const unsub = navigation.addListener("focus", load);
    load();
    return unsub;
  }, [navigation]);

  const budgetPercent = budget ? Math.min(100, (monthSummary.expense / budget) * 100) : 0;
  const remaining = Math.max(0, budget - monthSummary.expense);

  return (
    <Screen>
      <Text style={styles.title}>Overview</Text>
      <View style={styles.balance}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balanceAmount}>{money(summary.balance)}</Text>
        <View style={styles.balanceRow}>
          <View><Text style={styles.balanceLabel}>Income</Text><Text style={styles.income}>{money(summary.income)}</Text></View>
          <View><Text style={styles.balanceLabel}>Expense</Text><Text style={styles.expense}>{money(summary.expense)}</Text></View>
        </View>
      </View>

      <View style={styles.monthCard}>
        <View style={styles.monthHeader}>
          <View><Text style={styles.cardEyebrow}>THIS MONTH</Text><Text style={styles.monthTitle}>Monthly Spending</Text></View>
          <View style={styles.monthIcon}><CalendarDays size={20} color={colors.primary} /></View>
        </View>
        <View style={styles.monthNumbers}>
          <View><Text style={styles.smallLabel}>Spent</Text><Text style={styles.monthExpense}>{money(monthSummary.expense)}</Text></View>
          <View><Text style={styles.smallLabel}>Income</Text><Text style={styles.monthIncome}>{money(monthSummary.income)}</Text></View>
          {budget > 0 && <View><Text style={styles.smallLabel}>Left</Text><Text style={styles.monthLeft}>{money(remaining)}</Text></View>}
        </View>
        {budget > 0 ? (
          <>
            <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${budgetPercent}%`, backgroundColor: budgetPercent >= 90 ? colors.red : budgetPercent >= 70 ? colors.amber : colors.green }]} /></View>
            <Text style={styles.progressText}>{money(monthSummary.expense)} of {money(budget)} budget used ({Math.round(budgetPercent)}%)</Text>
          </>
        ) : (
          <Pressable onPress={() => navigation.navigate("Settings")} style={styles.setBudgetLink}>
            <Target size={16} color={colors.primary} /><Text style={styles.link}>Set a monthly budget</Text>
          </Pressable>
        )}
      </View>

      <SectionHeader title="Recent Transactions" action="See all" onPress={() => navigation.navigate("Transactions")} />
      {txs.length === 0 ? <Empty text={"কোনো transaction নেই।\nআজকের প্রথম খরচটি যোগ করুন।"} /> : txs.map((t) => <TransactionRow key={t.id} tx={t} />)}
      <Pressable style={styles.fab} onPress={() => navigation.navigate("AddTransaction")}><Plus color="#fff" size={27} /></Pressable>
    </Screen>
  );
}

function AddTransaction() {
  const navigation = useNavigation();
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [cats, setCats] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    (async () => {
      const c = await getCategories();
      const p = await getPaymentMethods();
      setCats(c);
      setPayments(p);
      setCategoryId(c.find((x) => x.type === "expense")?.id || "");
      setPaymentMethodId(p[0]?.id || "");
    })();
  }, []);
  useEffect(() => setCategoryId(cats.find((x) => x.type === type)?.id || ""), [type, cats]);

  const save = async () => {
    if (!amount || Number(amount) <= 0) return Alert.alert("Invalid amount", "Please enter a valid amount.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return Alert.alert("Invalid date", "Use YYYY-MM-DD format.");
    await addTransaction({ type, amount: Number(amount), categoryId, paymentMethodId, date: new Date(`${date}T12:00:00`).getTime(), note: note.trim() });
    Alert.alert("Saved", "Transaction saved successfully.");
    navigation.goBack();
  };

  return (
    <Screen>
      <Text style={styles.title}>Add Transaction</Text>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.segment}>
            <Pressable style={[styles.segmentBtn, type === "expense" && styles.segmentActive]} onPress={() => setType("expense")}><Text style={type === "expense" ? styles.redText : styles.muted}>Expense</Text></Pressable>
            <Pressable style={[styles.segmentBtn, type === "income" && styles.segmentActive]} onPress={() => setType("income")}><Text style={type === "income" ? styles.greenText : styles.muted}>Income</Text></Pressable>
          </View>
          <Field label="Amount (৳)" value={amount} onChangeText={setAmount} placeholder="0" keyboardType="decimal-pad" big />
          <Text style={styles.label}>Category</Text>
          <View style={styles.chips}>{cats.filter((c) => c.type === type).map((c) => <Pressable key={c.id} onPress={() => setCategoryId(c.id)} style={[styles.chip, categoryId === c.id && styles.chipActive]}><Text style={categoryId === c.id ? styles.chipActiveText : styles.chipText}>{c.name}</Text></Pressable>)}</View>
          <Text style={styles.label}>Payment Method</Text>
          <View style={styles.chips}>{payments.map((p) => <Pressable key={p.id} onPress={() => setPaymentMethodId(p.id)} style={[styles.chip, paymentMethodId === p.id && styles.chipActive]}><Text style={paymentMethodId === p.id ? styles.chipActiveText : styles.chipText}>{p.name}</Text></Pressable>)}</View>
          <Field label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} placeholder={todayISO()} />
          <Field label="Note (Optional)" value={note} onChangeText={setNote} placeholder="What was this for?" />
          <Pressable style={styles.primaryBtn} onPress={save}><Text style={styles.primaryText}>Save Transaction</Text></Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Transactions() {
  const [txs, setTxs] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const load = async () => setTxs((await getTransactions()).sort((a, b) => b.date - a.date));
  useEffect(() => { load(); }, []);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return txs.filter((tx) => {
      const matchesType = filter === "all" || tx.type === filter;
      const text = `${tx.note || ""} ${tx.amount} ${tx.categoryId || ""} ${tx.paymentMethodId || ""}`.toLowerCase();
      return matchesType && (!q || text.includes(q));
    });
  }, [txs, query, filter]);
  const remove = (id) => Alert.alert("Delete transaction?", "This action cannot be undone.", [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: async () => { await deleteTransaction(id); load(); } },
  ]);
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.pageHeader}><View><Text style={styles.title}>Transactions</Text><Text style={styles.subtle}>{filtered.length} result{filtered.length === 1 ? "" : "s"}</Text></View><SlidersHorizontal size={22} color={colors.muted} /></View>
        <View style={styles.searchBox}><Search size={19} color={colors.muted} /><TextInput value={query} onChangeText={setQuery} placeholder="Search note or amount..." placeholderTextColor="#94a3b8" style={styles.searchInput} /></View>
        <View style={styles.filterRow}>{[["all", "All"], ["expense", "Expense"], ["income", "Income"]].map(([key, label]) => <Pressable key={key} onPress={() => setFilter(key)} style={[styles.filterChip, filter === key && styles.filterChipActive]}><Text style={filter === key ? styles.filterTextActive : styles.filterText}>{label}</Text></Pressable>)}</View>
        <FlatList data={filtered} keyExtractor={(x) => x.id} showsVerticalScrollIndicator={false} ListEmptyComponent={<Empty text={query ? "No matching transactions." : "No transactions yet."} />} renderItem={({ item }) => <Pressable onLongPress={() => remove(item.id)}><TransactionRow tx={item} /></Pressable>} />
        <Text style={styles.hint}>Long press a transaction to delete it.</Text>
      </View>
    </SafeAreaView>
  );
}

function Statistics() {
  const [txs, setTxs] = useState([]);
  const [cats, setCats] = useState([]);
  useEffect(() => { Promise.all([getTransactions(), getCategories()]).then(([t, c]) => { setTxs(t); setCats(c); }); }, []);
  const current = txs.filter((t) => sameMonth(t.date));
  const income = current.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expense = current.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const categoryTotals = cats.filter((c) => c.type === "expense").map((c) => ({ ...c, total: current.filter((t) => t.type === "expense" && t.categoryId === c.id).reduce((s, t) => s + Number(t.amount), 0) })).filter((c) => c.total > 0).sort((a, b) => b.total - a.total);
  return (
    <Screen>
      <Text style={styles.title}>Statistics</Text>
      <Text style={styles.statsSubtitle}>Current month • {new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}</Text>
      <Stat icon={<TrendingUp size={22} color={colors.green} />} title="Monthly Income" value={income} />
      <Stat icon={<TrendingDown size={22} color={colors.red} />} title="Monthly Expense" value={expense} />
      <Stat icon={<Wallet size={22} color={colors.primary} />} title="Monthly Balance" value={income - expense} />
      <Text style={styles.sectionTitle}>Spending by Category</Text>
      <View style={styles.categoryCard}>
        {categoryTotals.length === 0 ? <Text style={styles.muted}>No expense data for this month.</Text> : categoryTotals.map((c) => {
          const percent = expense ? Math.round((c.total / expense) * 100) : 0;
          return <View key={c.id} style={styles.categoryItem}><View style={styles.categoryTop}><Text style={styles.categoryName}>{c.name}</Text><Text style={styles.categoryAmount}>{money(c.total)} • {percent}%</Text></View><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: colors.primary }]} /></View></View>;
        })}
      </View>
    </Screen>
  );
}

function SettingsScreen() {
  const [budget, setBudget] = useState("");
  const [savedBudget, setSavedBudget] = useState(0);
  const [saving, setSaving] = useState(false);
  useEffect(() => { getMonthlyBudget().then(setSavedBudget); }, []);
  const saveBudget = async () => {
    const value = Number(budget);
    if (!Number.isFinite(value) || value < 0) return Alert.alert("Invalid budget", "Enter a valid amount.");
    setSaving(true);
    const saved = await setMonthlyBudget(value);
    setSavedBudget(saved);
    setBudget("");
    setSaving(false);
    Alert.alert("Budget updated", value ? `This month's budget is ${money(value)}.` : "Monthly budget disabled.");
  };
  return (
    <Screen>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.setting}>
        <View style={styles.settingIcon}><Target size={21} color={colors.primary} /></View>
        <Text style={styles.settingTitle}>Monthly Budget</Text>
        <Text style={styles.muted}>Set a spending limit for {new Date().toLocaleString("en-US", { month: "long" })}.</Text>
        <TextInput value={budget} onChangeText={setBudget} keyboardType="decimal-pad" placeholder={savedBudget ? String(savedBudget) : "e.g. 30000"} placeholderTextColor="#94a3b8" style={[styles.input, { marginTop: 12 }]} />
        <Pressable style={styles.secondaryBtn} onPress={saveBudget} disabled={saving}><Text style={styles.secondaryText}>{saving ? "Saving..." : "Save Budget"}</Text></Pressable>
        {savedBudget > 0 && <Text style={styles.savedHint}>Current budget: {money(savedBudget)}</Text>}
      </View>
      <View style={styles.setting}><Text style={styles.settingTitle}>Daily Expanse</Text><Text style={styles.muted}>Offline expense tracker • Your data stays on this device.</Text></View>
      <View style={styles.setting}><Text style={styles.settingTitle}>Quick Tips</Text><Text style={styles.muted}>• Use Search to find old transactions.{"\n"}• Set a monthly budget to track spending.{"\n"}• Long press a transaction to delete it.</Text></View>
    </Screen>
  );
}

function Stat({ icon, title, value }) {
  return <View style={styles.statCard}>{icon}<Text style={styles.statTitle}>{title}</Text><Text style={styles.statValue}>{money(value)}</Text></View>;
}
function Screen({ children }) {
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.container}>{children}</ScrollView></SafeAreaView>;
}
function SectionHeader({ title, action, onPress }) {
  return <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text><Pressable onPress={onPress}><Text style={styles.link}>{action}</Text></Pressable></View>;
}
function Empty({ text }) {
  return <View style={styles.empty}><Text style={styles.muted}>{text}</Text></View>;
}
function TransactionRow({ tx }) {
  return <View style={styles.txRow}><View style={[styles.txIcon, { backgroundColor: tx.type === "income" ? "#dcfce7" : "#fee2e2" }]}>{tx.type === "income" ? <TrendingUp size={18} color={colors.green} /> : <TrendingDown size={18} color={colors.red} />}</View><View style={styles.txInfo}><Text style={styles.txNote}>{tx.note || "Transaction"}</Text><Text style={styles.txDate}>{new Date(tx.date).toLocaleDateString()}</Text></View><Text style={[styles.txAmount, { color: tx.type === "income" ? colors.green : colors.red }]}>{tx.type === "income" ? "+" : "-"}{money(tx.amount)}</Text></View>;
}
function Field({ label, value, onChangeText, placeholder, keyboardType, big }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#94a3b8" keyboardType={keyboardType} style={[styles.input, big && styles.bigInput]} /></View>;
}
function Tabs() {
  return <Tab.Navigator screenOptions={({ route }) => ({ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: "#94a3b8", tabBarStyle: { height: 66, paddingBottom: 8, paddingTop: 7 }, tabBarIcon: ({ color, size }) => { const I = route.name === "Home" ? Home : route.name === "Transactions" ? List : route.name === "Statistics" ? PieChart : Settings; return <I color={color} size={size} />; } })}>
    <Tab.Screen name="Home" component={Dashboard} />
    <Tab.Screen name="Transactions" component={Transactions} />
    <Tab.Screen name="Statistics" component={Statistics} />
    <Tab.Screen name="Settings" component={SettingsScreen} />
  </Tab.Navigator>;
}
function App() {
  const [ready, setReady] = useState(false);
  useEffect(() => { seedDatabase().then(() => setReady(true)); }, []);
  if (!ready) return <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.muted}>Loading Daily Expanse...</Text></View>;
  return <><StatusBar style="dark" /><NavigationContainer theme={DefaultTheme}><Stack.Navigator><Stack.Screen name="Main" component={Tabs} options={{ headerShown: false }} /><Stack.Screen name="AddTransaction" component={AddTransaction} options={{ title: "Add Transaction" }} /><Stack.Screen name="Transactions" component={Transactions} options={{ title: "Transactions" }} /></Stack.Navigator></NavigationContainer></>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 18, paddingBottom: 30 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  title: { fontSize: 28, fontWeight: "800", color: colors.text, marginBottom: 18 },
  balance: { backgroundColor: colors.primary, borderRadius: 22, padding: 22, marginBottom: 16 },
  balanceLabel: { color: "#dbeafe", fontSize: 12 },
  balanceAmount: { color: "#fff", fontSize: 34, fontWeight: "800", marginTop: 3 },
  balanceRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#ffffff33", marginTop: 20, paddingTop: 15 },
  income: { color: "#86efac", fontWeight: "700", marginTop: 3 },
  expense: { color: "#fca5a5", fontWeight: "700", marginTop: 3 },
  monthCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 17, marginBottom: 22 },
  monthHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardEyebrow: { fontSize: 11, fontWeight: "800", color: colors.primary, letterSpacing: 1 },
  monthTitle: { fontSize: 17, fontWeight: "800", color: colors.text, marginTop: 3 },
  monthIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#eff6ff", alignItems: "center", justifyContent: "center" },
  monthNumbers: { flexDirection: "row", justifyContent: "space-between", marginTop: 18 },
  smallLabel: { color: colors.muted, fontSize: 12 },
  monthExpense: { color: colors.red, fontWeight: "800", marginTop: 3 },
  monthIncome: { color: colors.green, fontWeight: "800", marginTop: 3 },
  monthLeft: { color: colors.primary, fontWeight: "800", marginTop: 3 },
  progressTrack: { height: 8, backgroundColor: "#e2e8f0", borderRadius: 99, overflow: "hidden", marginTop: 16 },
  progressFill: { height: "100%", borderRadius: 99 },
  progressText: { fontSize: 11, color: colors.muted, marginTop: 7 },
  setBudgetLink: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 18 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: colors.text },
  link: { color: colors.primary, fontWeight: "700" },
  txRow: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", marginBottom: 10 },
  txIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  txInfo: { flex: 1, marginLeft: 12 },
  txNote: { fontWeight: "600", color: colors.text },
  txDate: { fontSize: 12, color: colors.muted, marginTop: 3 },
  txAmount: { fontWeight: "800" },
  empty: { padding: 25, backgroundColor: "#f1f5f9", borderRadius: 16, alignItems: "center" },
  hint: { fontSize: 12, color: colors.muted, textAlign: "center", padding: 8 },
  segment: { flexDirection: "row", backgroundColor: "#e2e8f0", padding: 4, borderRadius: 12, marginBottom: 22 },
  segmentBtn: { flex: 1, alignItems: "center", paddingVertical: 11, borderRadius: 9 },
  segmentActive: { backgroundColor: "#fff" },
  muted: { color: colors.muted },
  redText: { color: colors.red, fontWeight: "700" },
  greenText: { color: colors.green, fontWeight: "700" },
  field: { marginBottom: 18 },
  label: { fontSize: 13, color: colors.muted, marginBottom: 8, fontWeight: "600" },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 13, fontSize: 16, color: colors.text },
  bigInput: { fontSize: 34, fontWeight: "800", paddingVertical: 15 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff" },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text },
  chipActiveText: { color: "#fff", fontWeight: "700" },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: 14, padding: 16, alignItems: "center", marginTop: 6, marginBottom: 30 },
  primaryText: { color: "#fff", fontSize: 17, fontWeight: "800" },
  statCard: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 20, marginBottom: 12 },
  statTitle: { color: colors.muted, marginTop: 10 },
  statValue: { fontSize: 25, fontWeight: "800", color: colors.text, marginTop: 4 },
  statsSubtitle: { color: colors.muted, marginTop: -10, marginBottom: 14 },
  categoryCard: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, marginTop: 12 },
  categoryItem: { marginBottom: 15 },
  categoryTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 7 },
  categoryName: { fontWeight: "700", color: colors.text },
  categoryAmount: { color: colors.muted, fontSize: 12 },
  setting: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 18, marginBottom: 12 },
  settingIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: "#eff6ff", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  settingTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 5 },
  secondaryBtn: { backgroundColor: "#eff6ff", borderRadius: 12, padding: 13, alignItems: "center", marginTop: 10 },
  secondaryText: { color: colors.primary, fontWeight: "800" },
  savedHint: { color: colors.green, fontSize: 12, marginTop: 9, fontWeight: "700" },
  pageHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  subtle: { color: colors.muted, marginTop: -13, marginBottom: 10 },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 13, marginBottom: 10 },
  searchInput: { flex: 1, padding: 12, fontSize: 15, color: colors.text },
  filterRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: "#e2e8f0" },
  filterChipActive: { backgroundColor: colors.primary },
  filterText: { color: colors.muted, fontWeight: "700" },
  filterTextActive: { color: "#fff", fontWeight: "800" },
  fab: { position: "absolute", right: 22, bottom: 24, width: 58, height: 58, borderRadius: 29, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", elevation: 6, shadowOpacity: 0.2, shadowRadius: 8 },
});
export default App;
