import React, { useEffect, useMemo, useState } from 'react';
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
  useWindowDimensions,
} from 'react-native';
import { NavigationContainer, DefaultTheme, useNavigation, useRoute } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
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
  FileText,
  Check,
  X,
  ChevronRight,
} from 'lucide-react-native';
import { seedDatabase } from './database/db';
import { addTransaction, deleteTransaction, getTransactions } from './services/transactionService';
import { getCategories, getPaymentMethods } from './services/dataService';
import { getMonthlyBudget, monthKey, setMonthlyBudget } from './services/budgetService';
import { addNote, deleteNote, getNotes, updateNote } from './services/notesService';

const colors = {
  bg: '#f8fafc',
  card: '#ffffff',
  text: '#0f172a',
  muted: '#64748b',
  primary: '#2563eb',
  primarySoft: '#eff6ff',
  border: '#e2e8f0',
  green: '#16a34a',
  greenSoft: '#f0fdf4',
  red: '#dc2626',
  redSoft: '#fef2f2',
  amber: '#d97706',
  amberSoft: '#fffbeb',
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const money = (n) => `৳ ${Number(n || 0).toLocaleString('en-IN')}`;
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const sameMonth = (timestamp, key = monthKey()) => monthKey(timestamp) === key;
const formatDate = (timestamp) => new Date(timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

function Screen({ children, scroll = true, style, keyboard = false }) {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(Math.max(width - 32, 280), 560);
  const content = scroll ? <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>{children}</ScrollView> : children;
  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.container, { width: contentWidth }, style]}>
        {keyboard ? <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboard}>{content}</KeyboardAvoidingView> : content}
      </View>
    </SafeAreaView>
  );
}

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
      if (t.type === 'income') income += amount;
      else expense += amount;
      if (sameMonth(t.date)) {
        if (t.type === 'income') monthIncome += amount;
        else monthExpense += amount;
      }
    });
    setSummary({ income, expense, balance: income - expense });
    setMonthSummary({ income: monthIncome, expense: monthExpense });
    setBudget(await getMonthlyBudget());
    setTxs(data.sort((a, b) => b.date - a.date).slice(0, 5));
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', load);
    load();
    return unsubscribe;
  }, [navigation]);

  const budgetPercent = budget ? Math.min(100, (monthSummary.expense / budget) * 100) : 0;
  const remaining = Math.max(0, budget - monthSummary.expense);

  return (
    <Screen>
      <View style={styles.brandHeader}>
        <View style={styles.brandMark}><Wallet size={21} color="#fff" /></View>
        <View style={{ flex: 1 }}><Text style={styles.brandTitle}>Daily Expanse</Text><Text style={styles.brandSubtitle}>Simple money. Clear mind.</Text></View>
        <Pressable onPress={() => navigation.navigate('Settings')} style={styles.iconButton}><Settings size={20} color={colors.muted} /></Pressable>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>CURRENT BALANCE</Text>
        <Text style={styles.balanceAmount}>{money(summary.balance)}</Text>
        <View style={styles.balanceRow}>
          <View style={styles.balanceStat}><View style={[styles.dot, { backgroundColor: colors.green }]} /><Text style={styles.balanceLabel}>Income</Text><Text style={styles.income}>{money(summary.income)}</Text></View>
          <View style={styles.balanceStat}><View style={[styles.dot, { backgroundColor: colors.red }]} /><Text style={styles.balanceLabel}>Expense</Text><Text style={styles.expense}>{money(summary.expense)}</Text></View>
        </View>
      </View>

      <View style={styles.monthCard}>
        <View style={styles.monthHeader}>
          <View><Text style={styles.cardEyebrow}>THIS MONTH</Text><Text style={styles.monthTitle}>Monthly Spending</Text></View>
          <View style={styles.monthIcon}><CalendarDays size={19} color={colors.primary} /></View>
        </View>
        <View style={styles.monthNumbers}>
          <View style={styles.numberBlock}><Text style={styles.smallLabel}>Spent</Text><Text style={styles.monthExpense}>{money(monthSummary.expense)}</Text></View>
          <View style={styles.numberBlock}><Text style={styles.smallLabel}>Income</Text><Text style={styles.monthIncome}>{money(monthSummary.income)}</Text></View>
          {budget > 0 && <View style={styles.numberBlock}><Text style={styles.smallLabel}>Left</Text><Text style={styles.monthLeft}>{money(remaining)}</Text></View>}
        </View>
        {budget > 0 ? (
          <>
            <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${budgetPercent}%`, backgroundColor: budgetPercent >= 90 ? colors.red : budgetPercent >= 70 ? colors.amber : colors.green }]} /></View>
            <Text style={styles.progressText}>{Math.round(budgetPercent)}% of {money(budget)} budget used</Text>
          </>
        ) : (
          <Pressable onPress={() => navigation.navigate('Settings')} style={styles.setBudgetLink}>
            <Target size={16} color={colors.primary} /><Text style={styles.link}>Set a monthly budget</Text><ChevronRight size={16} color={colors.primary} />
          </Pressable>
        )}
      </View>

      <SectionHeader title="Recent Transactions" action="See all" onPress={() => navigation.navigate('Transactions')} />
      {txs.length === 0 ? <Empty text={'No transactions yet.\nAdd your first expense or income.'} /> : txs.map((t) => <TransactionRow key={t.id} tx={t} />)}
      <Pressable style={styles.fab} onPress={() => navigation.navigate('AddTransaction')}><Plus color="#fff" size={25} /></Pressable>
    </Screen>
  );
}

function AddTransaction() {
  const navigation = useNavigation();
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState('');
  const [cats, setCats] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    (async () => {
      const [c, p] = await Promise.all([getCategories(), getPaymentMethods()]);
      setCats(c); setPayments(p);
      setCategoryId(c.find((x) => x.type === 'expense')?.id || '');
      setPaymentMethodId(p[0]?.id || '');
    })();
  }, []);
  useEffect(() => setCategoryId(cats.find((x) => x.type === type)?.id || ''), [type, cats]);

  const save = async () => {
    if (!amount || Number(amount) <= 0) return Alert.alert('Invalid amount', 'Please enter a valid amount.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return Alert.alert('Invalid date', 'Use YYYY-MM-DD format.');
    await addTransaction({ type, amount: Number(amount), categoryId, paymentMethodId, date: new Date(`${date}T12:00:00`).getTime(), note: note.trim() });
    Alert.alert('Saved', 'Transaction saved successfully.');
    navigation.goBack();
  };

  return (
    <Screen keyboard>
      <Text style={styles.title}>Add Transaction</Text>
      <Text style={styles.subtitle}>Record money in or money out.</Text>
      <View style={styles.segment}>
        <Pressable style={[styles.segmentBtn, type === 'expense' && styles.segmentActive]} onPress={() => setType('expense')}><Text style={type === 'expense' ? styles.redText : styles.muted}>Expense</Text></Pressable>
        <Pressable style={[styles.segmentBtn, type === 'income' && styles.segmentActive]} onPress={() => setType('income')}><Text style={type === 'income' ? styles.greenText : styles.muted}>Income</Text></Pressable>
      </View>
      <Field label="Amount (৳)" value={amount} onChangeText={setAmount} placeholder="0" keyboardType="decimal-pad" big />
      <Text style={styles.label}>Category</Text>
      <View style={styles.chips}>{cats.filter((c) => c.type === type).map((c) => <Pressable key={c.id} onPress={() => setCategoryId(c.id)} style={[styles.chip, categoryId === c.id && styles.chipActive]}><Text style={categoryId === c.id ? styles.chipActiveText : styles.chipText}>{c.name}</Text></Pressable>)}</View>
      <Text style={styles.label}>Payment Method</Text>
      <View style={styles.chips}>{payments.map((p) => <Pressable key={p.id} onPress={() => setPaymentMethodId(p.id)} style={[styles.chip, paymentMethodId === p.id && styles.chipActive]}><Text style={paymentMethodId === p.id ? styles.chipActiveText : styles.chipText}>{p.name}</Text></Pressable>)}</View>
      <Field label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} placeholder={todayISO()} />
      <Field label="Transaction note" value={note} onChangeText={setNote} placeholder="Optional: lunch, bus fare, salary..." />
      <Pressable style={styles.primaryBtn} onPress={save}><Text style={styles.primaryText}>Save Transaction</Text></Pressable>
    </Screen>
  );
}

function Transactions() {
  const navigation = useNavigation();
  const [txs, setTxs] = useState([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); setTxs((await getTransactions()).sort((a, b) => b.date - a.date)); setLoading(false); };
  useEffect(() => { const unsub = navigation.addListener('focus', load); load(); return unsub; }, [navigation]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return txs.filter((tx) => {
      const matchesType = filter === 'all' || tx.type === filter;
      const text = `${tx.note || ''} ${tx.amount} ${tx.categoryId || ''} ${tx.paymentMethodId || ''}`.toLowerCase();
      return matchesType && (!q || text.includes(q));
    });
  }, [txs, query, filter]);
  const remove = (id) => Alert.alert('Delete transaction?', 'This action cannot be undone.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => { await deleteTransaction(id); load(); } },
  ]);
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.listContainer}>
        <View style={styles.pageHeader}><View><Text style={styles.title}>Transactions</Text><Text style={styles.subtle}>{filtered.length} result{filtered.length === 1 ? '' : 's'}</Text></View><SlidersHorizontal size={21} color={colors.muted} /></View>
        <View style={styles.searchBox}><Search size={18} color={colors.muted} /><TextInput value={query} onChangeText={setQuery} placeholder="Search notes or amount..." placeholderTextColor="#94a3b8" style={styles.searchInput} /></View>
        <View style={styles.filterRow}>{[['all', 'All'], ['expense', 'Expense'], ['income', 'Income']].map(([key, label]) => <Pressable key={key} onPress={() => setFilter(key)} style={[styles.filterChip, filter === key && styles.filterChipActive]}><Text style={filter === key ? styles.filterTextActive : styles.filterText}>{label}</Text></Pressable>)}</View>
        {loading ? <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View> : <FlatList data={filtered} keyExtractor={(x) => x.id} showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent} ListEmptyComponent={<Empty text={query ? 'No matching transactions.' : 'No transactions yet.'} />} renderItem={({ item }) => <Pressable onLongPress={() => remove(item.id)}><TransactionRow tx={item} /></Pressable>} />}
        <Text style={styles.hint}>Long press a transaction to delete it.</Text>
      </View>
    </SafeAreaView>
  );
}

function Notes() {
  const navigation = useNavigation();
  const [notes, setNotes] = useState([]);
  const [query, setQuery] = useState('');
  const load = async () => setNotes(await getNotes());
  useEffect(() => { const unsub = navigation.addListener('focus', load); load(); return unsub; }, [navigation]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes.filter((n) => !q || `${n.title} ${n.content}`.toLowerCase().includes(q));
  }, [notes, query]);
  const remove = (id) => Alert.alert('Delete note?', 'This note will be permanently removed.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => { await deleteNote(id); load(); } },
  ]);
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.listContainer}>
        <View style={styles.pageHeader}><View><Text style={styles.title}>Notes</Text><Text style={styles.subtle}>Keep quick ideas, reminders & details.</Text></View><Pressable onPress={() => navigation.navigate('NoteEditor', { noteId: null })} style={styles.smallAdd}><Plus size={19} color="#fff" /></Pressable></View>
        <View style={styles.searchBox}><Search size={18} color={colors.muted} /><TextInput value={query} onChangeText={setQuery} placeholder="Search notes..." placeholderTextColor="#94a3b8" style={styles.searchInput} /></View>
        <FlatList data={filtered} keyExtractor={(x) => x.id} showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent} ListEmptyComponent={<Empty text={query ? 'No matching notes.' : 'No notes yet. Tap + to create one.'} />} renderItem={({ item }) => <Pressable onPress={() => navigation.navigate('NoteEditor', { noteId: item.id })} onLongPress={() => remove(item.id)}><View style={styles.noteCard}><View style={styles.noteIcon}><FileText size={18} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={styles.noteTitle} numberOfLines={1}>{item.title || 'Untitled note'}</Text><Text style={styles.notePreview} numberOfLines={2}>{item.content || 'No content'}</Text><Text style={styles.noteDate}>{formatDate(item.updatedAt || item.createdAt)}</Text></View><ChevronRight size={17} color={colors.muted} /></View></Pressable>} />
        <Text style={styles.hint}>Tap to edit • Long press to delete</Text>
      </View>
    </SafeAreaView>
  );
}

function NoteEditor() {
  const navigation = useNavigation();
  const route = useRoute();
  const noteId = route.params?.noteId;
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(Boolean(noteId));

  useEffect(() => {
    if (!noteId) return;
    (async () => {
      const all = await getNotes();
      const note = all.find((n) => n.id === noteId);
      if (note) { setTitle(note.title || ''); setContent(note.content || ''); }
      setLoading(false);
    })();
  }, [noteId]);

  const save = async () => {
    if (!title.trim() && !content.trim()) return Alert.alert('Empty note', 'Add a title or some content first.');
    if (noteId) await updateNote(noteId, { title: title.trim(), content: content.trim() });
    else await addNote({ title: title.trim() || 'Untitled note', content: content.trim() });
    navigation.goBack();
  };

  if (loading) return <Screen><ActivityIndicator color={colors.primary} /></Screen>;
  return (
    <Screen keyboard>
      <View style={styles.editorHeader}><View><Text style={styles.title}>{noteId ? 'Edit Note' : 'New Note'}</Text><Text style={styles.subtle}>Write something you want to keep.</Text></View><Pressable onPress={() => navigation.goBack()} style={styles.closeButton}><X size={20} color={colors.muted} /></Pressable></View>
      <Text style={styles.label}>Title</Text>
      <TextInput value={title} onChangeText={setTitle} placeholder="Note title" placeholderTextColor="#94a3b8" style={styles.input} />
      <Text style={styles.label}>Content</Text>
      <TextInput value={content} onChangeText={setContent} placeholder="Start writing..." placeholderTextColor="#94a3b8" style={styles.noteInput} multiline textAlignVertical="top" />
      <Pressable style={styles.primaryBtn} onPress={save}><Check size={18} color="#fff" /><Text style={styles.primaryText}>Save Note</Text></Pressable>
    </Screen>
  );
}

function Statistics() {
  const [txs, setTxs] = useState([]);
  const [cats, setCats] = useState([]);
  useEffect(() => { (async () => { const [t, c] = await Promise.all([getTransactions(), getCategories()]); setTxs(t); setCats(c); })(); }, []);
  const current = txs.filter((t) => sameMonth(t.date));
  const income = current.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
  const expense = current.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);
  const groups = cats.filter((c) => c.type === 'expense').map((c) => ({ ...c, amount: current.filter((t) => t.categoryId === c.id && t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0) })).filter((c) => c.amount > 0).sort((a, b) => b.amount - a.amount);
  return <Screen><Text style={styles.title}>Statistics</Text><Text style={styles.statsSubtitle}>Current month overview</Text><View style={styles.statCard}><View style={styles.statIcon}><TrendingUp size={19} color={colors.green} /></View><View><Text style={styles.statTitle}>Income</Text><Text style={styles.statValue}>{money(income)}</Text></View></View><View style={styles.statCard}><View style={styles.statIcon}><TrendingDown size={19} color={colors.red} /></View><View><Text style={styles.statTitle}>Expense</Text><Text style={styles.statValue}>{money(expense)}</Text></View></View><View style={styles.statCard}><View style={styles.statIcon}><Wallet size={19} color={colors.primary} /></View><View><Text style={styles.statTitle}>Net</Text><Text style={styles.statValue}>{money(income - expense)}</Text></View></View><Text style={styles.sectionTitle}>Expense by Category</Text><View style={styles.categoryCard}>{groups.length === 0 ? <Empty text="No expenses this month." /> : groups.map((g) => <View key={g.id} style={styles.categoryItem}><View style={styles.categoryTop}><Text style={styles.categoryName}>{g.name}</Text><Text style={styles.categoryAmount}>{money(g.amount)}</Text></View><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${expense ? Math.min(100, (g.amount / expense) * 100) : 0}%` }]} /></View></View>)}</View></Screen>;
}

function SettingsScreen() {
  const [budget, setBudget] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => { (async () => { const b = await getMonthlyBudget(); setBudget(b ? String(b) : ''); })(); }, []);
  const save = async () => { await setMonthlyBudget(Number(budget) || 0); setSaved(true); setTimeout(() => setSaved(false), 1600); };
  return <Screen><Text style={styles.title}>Settings</Text><Text style={styles.subtitle}>Personalize your monthly money plan.</Text><View style={styles.settingsCard}><View style={styles.settingIcon}><Target size={19} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={styles.settingTitle}>Monthly Budget</Text><Text style={styles.settingHint}>Used to track your spending progress.</Text></View></View><Field label="Budget (৳)" value={budget} onChangeText={setBudget} placeholder="e.g. 20000" keyboardType="decimal-pad" /><Pressable style={styles.primaryBtn} onPress={save}><Text style={styles.primaryText}>{saved ? 'Saved ✓' : 'Save Budget'}</Text></Pressable><View style={styles.infoCard}><Text style={styles.infoTitle}>Daily Expanse</Text><Text style={styles.infoText}>Your data is stored locally on this device. No account or server is required.</Text></View></Screen>;
}

function SectionHeader({ title, action, onPress }) { return <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text><Pressable onPress={onPress}><Text style={styles.link}>{action}</Text></Pressable></View>; }
function Empty({ text }) { return <View style={styles.empty}><FileText size={20} color={colors.muted} /><Text style={styles.emptyText}>{text}</Text></View>; }
function Field({ label, value, onChangeText, placeholder, keyboardType, big = false }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#94a3b8" keyboardType={keyboardType} style={[styles.input, big && styles.bigInput]} /></View>; }
function TransactionRow({ tx }) { return <View style={styles.transactionRow}><View style={[styles.txIcon, { backgroundColor: tx.type === 'income' ? colors.greenSoft : colors.redSoft }]}>{tx.type === 'income' ? <TrendingUp size={18} color={colors.green} /> : <TrendingDown size={18} color={colors.red} />}</View><View style={{ flex: 1 }}><Text style={styles.txTitle}>{tx.note || (tx.type === 'income' ? 'Income' : 'Expense')}</Text><Text style={styles.txMeta}>{formatDate(tx.date)}</Text></View><Text style={tx.type === 'income' ? styles.income : styles.expense}>{tx.type === 'income' ? '+' : '-'}{money(tx.amount)}</Text></View>; }

function Tabs() {
  return <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: '#94a3b8', tabBarLabelStyle: { fontSize: 10, fontWeight: '700' }, tabBarStyle: { height: Platform.OS === 'ios' ? 80 : 62, paddingTop: 6, paddingBottom: Platform.OS === 'ios' ? 21 : 7, borderTopColor: colors.border, backgroundColor: colors.card }, tabBarHideOnKeyboard: true }}>
    <Tab.Screen name="Home" component={Dashboard} options={{ tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }} />
    <Tab.Screen name="Transactions" component={Transactions} options={{ tabBarIcon: ({ color, size }) => <List color={color} size={size} /> }} />
    <Tab.Screen name="Notes" component={Notes} options={{ tabBarIcon: ({ color, size }) => <FileText color={color} size={size} /> }} />
    <Tab.Screen name="Statistics" component={Statistics} options={{ tabBarIcon: ({ color, size }) => <PieChart color={color} size={size} /> }} />
    <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarIcon: ({ color, size }) => <Settings color={color} size={size} /> }} />
  </Tab.Navigator>;
}

export default function App() {
  useEffect(() => { seedDatabase(); }, []);
  return <NavigationContainer theme={{ ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.bg, primary: colors.primary } }}><StatusBar style="dark" /><Stack.Navigator screenOptions={{ headerShown: false }}><Stack.Screen name="Tabs" component={Tabs} /><Stack.Screen name="AddTransaction" component={AddTransaction} /><Stack.Screen name="NoteEditor" component={NoteEditor} /></Stack.Navigator></NavigationContainer>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { alignSelf: 'center', flex: 1 },
  keyboard: { flex: 1 },
  scrollContent: { paddingTop: 2, paddingBottom: 120 },
  brandHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  brandMark: { width: 36, height: 36, borderRadius: 11, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  brandTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  brandSubtitle: { color: colors.muted, fontSize: 10, marginTop: 2 },
  iconButton: { width: 36, height: 36, borderRadius: 11, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 22, lineHeight: 27, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 3, marginBottom: 11 },
  subtle: { color: colors.muted, fontSize: 10, marginTop: 3 },
  balanceCard: { backgroundColor: colors.text, borderRadius: 18, padding: 14, marginBottom: 10 },
  balanceLabel: { color: '#cbd5e1', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  balanceAmount: { color: '#fff', fontSize: 26, lineHeight: 32, fontWeight: '900', marginTop: 3, marginBottom: 12 },
  balanceRow: { flexDirection: 'row', gap: 18 },
  balanceStat: { flex: 1, minWidth: 0 },
  dot: { width: 7, height: 7, borderRadius: 4, marginBottom: 5 },
  income: { color: colors.green, fontSize: 13, fontWeight: '800', marginTop: 3 },
  expense: { color: colors.red, fontSize: 13, fontWeight: '800', marginTop: 3 },
  monthCard: { backgroundColor: colors.card, borderRadius: 17, borderWidth: 1, borderColor: colors.border, padding: 15, marginBottom: 17 },
  monthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardEyebrow: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
  monthTitle: { color: colors.text, fontSize: 15, fontWeight: '800', marginTop: 2 },
  monthIcon: { width: 37, height: 37, borderRadius: 11, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  monthNumbers: { flexDirection: 'row', gap: 10, marginTop: 15 },
  numberBlock: { flex: 1, minWidth: 0 },
  smallLabel: { color: colors.muted, fontSize: 9, fontWeight: '600' },
  monthExpense: { color: colors.red, fontSize: 14, fontWeight: '800', marginTop: 2 },
  monthIncome: { color: colors.green, fontSize: 14, fontWeight: '800', marginTop: 2 },
  monthLeft: { color: colors.primary, fontSize: 14, fontWeight: '800', marginTop: 2 },
  progressTrack: { height: 7, backgroundColor: '#e2e8f0', borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5, backgroundColor: colors.primary },
  progressText: { color: colors.muted, fontSize: 9, marginTop: 6 },
  setBudgetLink: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 12 },
  link: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
  transactionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 11, marginBottom: 7 },
  txIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  txTitle: { color: colors.text, fontSize: 12, fontWeight: '700' },
  txMeta: { color: colors.muted, fontSize: 9, marginTop: 2 },
  fab: { position: 'absolute', right: 0, bottom: Platform.OS === 'ios' ? 94 : 76, width: 55, height: 55, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 5 },
  segment: { flexDirection: 'row', backgroundColor: '#e2e8f0', padding: 3, borderRadius: 13, marginBottom: 16 },
  segmentBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 39, borderRadius: 10 },
  segmentActive: { backgroundColor: colors.card, elevation: 1 },
  redText: { color: colors.red, fontWeight: '800', fontSize: 12 },
  greenText: { color: colors.green, fontWeight: '800', fontSize: 12 },
  muted: { color: colors.muted, fontWeight: '700', fontSize: 12 },
  field: { marginBottom: 10 },
  label: { color: colors.text, fontSize: 11, fontWeight: '800', marginBottom: 6 },
  input: { height: 44, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.card, paddingHorizontal: 13, color: colors.text, fontSize: 13 },
  bigInput: { height: 52, fontSize: 22, fontWeight: '800' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 14 },
  chip: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primarySoft, borderColor: '#bfdbfe' },
  chipText: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  chipActiveText: { color: colors.primary, fontSize: 10, fontWeight: '800' },
  primaryBtn: { minHeight: 47, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, marginTop: 3 },
  primaryText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  listContainer: { flex: 1, width: '100%', alignSelf: 'center', paddingHorizontal: 16, paddingTop: 10, maxWidth: 560 },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  searchBox: { height: 43, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.card, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, color: colors.text, fontSize: 12, paddingVertical: 0 },
  filterRow: { flexDirection: 'row', gap: 7, marginVertical: 10 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 9, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  filterTextActive: { color: '#fff', fontSize: 10, fontWeight: '800' },
  listContent: { paddingBottom: 92, paddingTop: 2 },
  hint: { color: colors.muted, textAlign: 'center', fontSize: 9, paddingVertical: 6 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 38, gap: 8 },
  emptyText: { color: colors.muted, textAlign: 'center', fontSize: 11, lineHeight: 17 },
  smallAdd: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  noteCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 11, marginBottom: 7 },
  noteIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  noteTitle: { color: colors.text, fontSize: 12, fontWeight: '800' },
  notePreview: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 2 },
  noteDate: { color: '#94a3b8', fontSize: 8, marginTop: 3 },
  editorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  closeButton: { width: 37, height: 37, borderRadius: 11, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  noteInput: { minHeight: 180, borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.card, padding: 14, color: colors.text, fontSize: 14, lineHeight: 21, marginBottom: 16 },
  statsSubtitle: { color: colors.muted, fontSize: 11, marginTop: 3, marginBottom: 10 },
  statCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 15, padding: 13, marginBottom: 8 },
  statIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  statTitle: { color: colors.muted, fontSize: 10, fontWeight: '600' },
  statValue: { color: colors.text, fontSize: 17, fontWeight: '800', marginTop: 2 },
  categoryCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 15, padding: 14 },
  categoryItem: { marginBottom: 13 },
  categoryTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 6 },
  categoryName: { color: colors.text, fontSize: 11, fontWeight: '700' },
  categoryAmount: { color: colors.muted, fontSize: 10 },
  settingsCard: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 15, padding: 14, marginTop: 3, marginBottom: 16 },
  settingIcon: { width: 39, height: 39, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  settingTitle: { color: colors.text, fontSize: 13, fontWeight: '800' },
  settingHint: { color: colors.muted, fontSize: 10, marginTop: 3 },
  infoCard: { backgroundColor: colors.amberSoft, borderWidth: 1, borderColor: '#fde68a', borderRadius: 14, padding: 13, marginTop: 4 },
  infoTitle: { color: colors.amber, fontSize: 11, fontWeight: '800', marginBottom: 4 },
  infoText: { color: '#92400e', fontSize: 10, lineHeight: 16 },
});
