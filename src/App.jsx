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
  Trash2,
  Pencil,
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

function Screen({ children, scroll = true, style }) {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(Math.max(width - 32, 280), 560);
  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.container, { width: contentWidth }, style]}>
        {scroll ? <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>{children}</ScrollView> : children}
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
        <View style={{ flex: 1 }}><Text style={styles.brandTitle}>Daily Expanse</Text><Text style={styles.brandSubtitle}>Simple money, clear mind.</Text></View>
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
    <Screen>
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
        <FlatList data={filtered} keyExtractor={(x) => x.id} showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent} ListEmptyComponent={<Empty text={query ? 'No matching notes.' : 'No notes yet.\nTap + to create your first note.'} />} renderItem={({ item }) => (
          <Pressable onPress={() => navigation.navigate('NoteEditor', { noteId: item.id })} onLongPress={() => remove(item.id)} style={styles.noteCard}>
            <View style={styles.noteIcon}><FileText size={19} color={colors.primary} /></View>
            <View style={{ flex: 1 }}><Text style={styles.noteTitle} numberOfLines={1}>{item.title || 'Untitled note'}</Text><Text style={styles.notePreview} numberOfLines={2}>{item.content || 'Empty note'}</Text><Text style={styles.noteDate}>{formatDate(item.updatedAt)}</Text></View>
            <ChevronRight size={18} color="#94a3b8" />
          </Pressable>
        )} />
        <Text style={styles.hint}>Tap to edit • Long press to delete.</Text>
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
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!noteId) return;
    getNotes().then((items) => {
      const note = items.find((n) => n.id === noteId);
      if (note) { setTitle(note.title); setContent(note.content); }
    });
  }, [noteId]);
  const save = async () => {
    if (!title.trim() && !content.trim()) return Alert.alert('Empty note', 'Add a title or some text first.');
    setSaving(true);
    if (noteId) await updateNote(noteId, { title, content });
    else await addNote({ title, content });
    setSaving(false);
    navigation.goBack();
  };
  return (
    <Screen>
      <View style={styles.editorHeader}><Text style={styles.title}>{noteId ? 'Edit Note' : 'New Note'}</Text><Pressable onPress={() => navigation.goBack()} style={styles.closeButton}><X size={20} color={colors.muted} /></Pressable></View>
      <Field label="Title" value={title} onChangeText={setTitle} placeholder="Note title" />
      <Text style={styles.label}>Note</Text>
      <TextInput value={content} onChangeText={setContent} placeholder="Write anything..." placeholderTextColor="#94a3b8" multiline textAlignVertical="top" style={styles.noteInput} />
      <Pressable style={[styles.primaryBtn, saving && styles.disabled]} disabled={saving} onPress={save}><Check size={18} color="#fff" /><Text style={styles.primaryText}>{saving ? 'Saving...' : 'Save Note'}</Text></Pressable>
    </Screen>
  );
}

function Statistics() {
  const [txs, setTxs] = useState([]);
  const [cats, setCats] = useState([]);
  useEffect(() => { Promise.all([getTransactions(), getCategories()]).then(([t, c]) => { setTxs(t); setCats(c); }); }, []);
  const current = txs.filter((t) => sameMonth(t.date));
  const income = current.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const expense = current.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const categoryTotals = cats.filter((c) => c.type === 'expense').map((c) => ({ ...c, total: current.filter((t) => t.type === 'expense' && t.categoryId === c.id).reduce((s, t) => s + Number(t.amount), 0) })).filter((c) => c.total > 0).sort((a, b) => b.total - a.total);
  return (
    <Screen>
      <Text style={styles.title}>Statistics</Text>
      <Text style={styles.subtitle}>Current month • {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}</Text>
      <Stat icon={<TrendingUp size={20} color={colors.green} />} title="Monthly Income" value={income} />
      <Stat icon={<TrendingDown size={20} color={colors.red} />} title="Monthly Expense" value={expense} />
      <Stat icon={<Wallet size={20} color={colors.primary} />} title="Monthly Balance" value={income - expense} />
      <Text style={styles.sectionTitle}>Spending by Category</Text>
      <View style={styles.categoryCard}>
        {categoryTotals.length === 0 ? <Text style={styles.muted}>No expense data for this month.</Text> : categoryTotals.map((c) => {
          const percent = expense ? Math.round((c.total / expense) * 100) : 0;
          return <View key={c.id} style={styles.categoryItem}><View style={styles.categoryTop}><Text style={styles.categoryName}>{c.name}</Text><Text style={styles.categoryAmount}>{money(c.total)} • {percent}%</Text></View><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${percent}%` }]} /></View></View>;
        })}
      </View>
    </Screen>
  );
}

function SettingsScreen() {
  const [budget, setBudget] = useState('');
  const [savedBudget, setSavedBudget] = useState(0);
  const [saving, setSaving] = useState(false);
  useEffect(() => { getMonthlyBudget().then(setSavedBudget); }, []);
  const saveBudget = async () => {
    if (budget.trim() === '') return Alert.alert('Enter budget', 'Please enter a monthly budget amount.');
    const value = Number(budget);
    if (!Number.isFinite(value) || value < 0) return Alert.alert('Invalid budget', 'Enter a valid amount.');
    setSaving(true);
    const saved = await setMonthlyBudget(value);
    setSavedBudget(saved); setBudget(''); setSaving(false);
    Alert.alert('Budget updated', value ? `This month's budget is ${money(value)}.` : 'Monthly budget disabled.');
  };
  return (
    <Screen>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Control your monthly spending target.</Text>
      <View style={styles.settingsCard}>
        <View style={styles.settingIcon}><Target size={20} color={colors.primary} /></View>
        <View style={{ flex: 1 }}><Text style={styles.settingTitle}>Monthly Budget</Text><Text style={styles.settingHint}>Current: {savedBudget ? money(savedBudget) : 'Not set'}</Text></View>
      </View>
      <Field label="New monthly budget (৳)" value={budget} onChangeText={setBudget} placeholder={savedBudget ? String(savedBudget) : '30000'} keyboardType="decimal-pad" />
      <Pressable style={[styles.primaryBtn, saving && styles.disabled]} disabled={saving} onPress={saveBudget}><Check size={18} color="#fff" /><Text style={styles.primaryText}>{saving ? 'Saving...' : 'Save Budget'}</Text></Pressable>
      <View style={styles.infoCard}><Text style={styles.infoTitle}>Tip</Text><Text style={styles.infoText}>Set a realistic monthly target. The dashboard will show how much of it you have used.</Text></View>
    </Screen>
  );
}

function TransactionRow({ tx }) {
  const income = tx.type === 'income';
  return (
    <View style={styles.transactionRow}>
      <View style={[styles.txIcon, { backgroundColor: income ? colors.greenSoft : colors.redSoft }]}>{income ? <TrendingUp size={17} color={colors.green} /> : <TrendingDown size={17} color={colors.red} />}</View>
      <View style={{ flex: 1, minWidth: 0 }}><Text style={styles.txNote} numberOfLines={1}>{tx.note || (income ? 'Income' : 'Expense')}</Text><Text style={styles.txDate}>{formatDate(tx.date)}</Text></View>
      <Text style={[styles.txAmount, { color: income ? colors.green : colors.red }]}>{income ? '+' : '-'}{money(tx.amount)}</Text>
    </View>
  );
}

function Stat({ icon, title, value }) {
  return <View style={styles.statCard}><View style={styles.statIcon}>{icon}</View><View style={{ flex: 1 }}><Text style={styles.statTitle}>{title}</Text><Text style={styles.statValue}>{money(value)}</Text></View></View>;
}

function SectionHeader({ title, action, onPress }) {
  return <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text><Pressable onPress={onPress}><Text style={styles.link}>{action}</Text></Pressable></View>;
}

function Field({ label, value, onChangeText, placeholder, keyboardType, big }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#94a3b8" keyboardType={keyboardType} style={[styles.input, big && styles.bigInput]} /></View>;
}

function Empty({ text }) {
  return <View style={styles.empty}><FileText size={26} color="#94a3b8" /><Text style={styles.emptyText}>{text}</Text></View>;
}

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginBottom: Platform.OS === 'ios' ? 0 : 2 },
        tabBarStyle: { height: Platform.OS === 'ios' ? 82 : 64, paddingTop: 7, borderTopColor: colors.border, backgroundColor: '#fff', elevation: 8 },
        tabBarIcon: ({ color, size }) => {
          const icons = { Home, Transactions: List, Notes: FileText, Statistics: PieChart, Settings };
          const Icon = icons[route.name] || Home;
          return <Icon color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={Dashboard} />
      <Tab.Screen name="Transactions" component={Transactions} />
      <Tab.Screen name="Notes" component={Notes} />
      <Tab.Screen name="Statistics" component={Statistics} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  useEffect(() => { seedDatabase(); }, []);
  return (
    <NavigationContainer theme={{ ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.bg, card: colors.card, text: colors.text, border: colors.border, primary: colors.primary } }}>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="Tabs" component={AppTabs} />
        <Stack.Screen name="AddTransaction" component={AddTransaction} />
        <Stack.Screen name="NoteEditor" component={NoteEditor} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, alignSelf: 'center' },
  listContainer: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 12 },
  scrollContent: { paddingTop: 12, paddingBottom: 110 },
  brandHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  brandMark: { width: 42, height: 42, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  brandTitle: { fontSize: 19, fontWeight: '800', color: colors.text },
  brandSubtitle: { fontSize: 11, color: colors.muted, marginTop: 1 },
  iconButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 25, lineHeight: 31, fontWeight: '800', color: colors.text, letterSpacing: -0.4 },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 4, marginBottom: 16 },
  balanceCard: { backgroundColor: colors.text, borderRadius: 22, padding: 20, marginBottom: 14 },
  balanceLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.8 },
  balanceAmount: { fontSize: 30, lineHeight: 38, fontWeight: '800', color: '#fff', marginTop: 5, marginBottom: 17 },
  balanceRow: { flexDirection: 'row', gap: 12 },
  balanceStat: { flex: 1, borderRadius: 13, padding: 11, backgroundColor: '#1e293b' },
  dot: { width: 7, height: 7, borderRadius: 4, marginBottom: 7 },
  income: { color: '#86efac', fontSize: 15, fontWeight: '700', marginTop: 3 },
  expense: { color: '#fca5a5', fontSize: 15, fontWeight: '700', marginTop: 3 },
  monthCard: { backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 17, marginBottom: 20 },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  cardEyebrow: { fontSize: 9, fontWeight: '800', color: colors.primary, letterSpacing: 1 },
  monthTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: 2 },
  monthIcon: { width: 37, height: 37, borderRadius: 11, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  monthNumbers: { flexDirection: 'row', gap: 8, marginBottom: 15 },
  numberBlock: { flex: 1 },
  smallLabel: { fontSize: 10, color: colors.muted, marginBottom: 3 },
  monthExpense: { fontSize: 14, fontWeight: '800', color: colors.red },
  monthIncome: { fontSize: 14, fontWeight: '800', color: colors.green },
  monthLeft: { fontSize: 14, fontWeight: '800', color: colors.primary },
  progressTrack: { height: 7, borderRadius: 4, backgroundColor: '#e2e8f0', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: colors.primary },
  progressText: { fontSize: 10, color: colors.muted, marginTop: 7 },
  setBudgetLink: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 4 },
  link: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 10 },
  transactionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 11, marginBottom: 8 },
  txIcon: { width: 35, height: 35, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  txNote: { fontSize: 13, fontWeight: '700', color: colors.text },
  txDate: { fontSize: 10, color: colors.muted, marginTop: 2 },
  txAmount: { fontSize: 12, fontWeight: '800', maxWidth: 120, textAlign: 'right' },
  fab: { position: 'absolute', right: 18, bottom: 24, width: 55, height: 55, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 8 },
  segment: { flexDirection: 'row', backgroundColor: '#e2e8f0', borderRadius: 13, padding: 3, marginBottom: 17 },
  segmentBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  segmentActive: { backgroundColor: colors.card, elevation: 1 },
  redText: { color: colors.red, fontWeight: '800', fontSize: 13 },
  greenText: { color: colors.green, fontWeight: '800', fontSize: 13 },
  muted: { color: colors.muted, fontSize: 12 },
  label: { fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 7 },
  field: { marginBottom: 14 },
  input: { height: 47, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.card, paddingHorizontal: 13, color: colors.text, fontSize: 14 },
  bigInput: { height: 58, fontSize: 23, fontWeight: '800' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 14 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  chipActive: { backgroundColor: colors.primarySoft, borderColor: '#bfdbfe' },
  chipText: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  chipActiveText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  primaryBtn: { minHeight: 49, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, marginTop: 5, marginBottom: 16 },
  primaryText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  disabled: { opacity: 0.6 },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 7, marginBottom: 13 },
  subtle: { fontSize: 11, color: colors.muted, marginTop: 3 },
  searchBox: { height: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: 12, marginBottom: 9 },
  searchInput: { flex: 1, color: colors.text, fontSize: 13, paddingVertical: 0 },
  filterRow: { flexDirection: 'row', gap: 7, marginBottom: 9 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: '#e2e8f0' },
  filterChipActive: { backgroundColor: colors.primary },
  filterText: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  filterTextActive: { color: '#fff', fontSize: 11, fontWeight: '800' },
  listContent: { paddingBottom: 70 },
  hint: { textAlign: 'center', color: '#94a3b8', fontSize: 9, paddingVertical: 7 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { minHeight: 180, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, borderRadius: 16, alignItems: 'center', justifyContent: 'center', padding: 24, marginTop: 8 },
  emptyText: { textAlign: 'center', color: colors.muted, fontSize: 12, lineHeight: 19, marginTop: 9 },
  smallAdd: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  noteCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 15, padding: 12, marginBottom: 8 },
  noteIcon: { width: 37, height: 37, borderRadius: 11, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  noteTitle: { color: colors.text, fontSize: 13, fontWeight: '800' },
  notePreview: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 2 },
  noteDate: { color: '#94a3b8', fontSize: 9, marginTop: 4 },
  editorHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  closeButton: { width: 38, height: 38, borderRadius: 11, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  noteInput: { minHeight: 240, borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.card, padding: 14, color: colors.text, fontSize: 14, lineHeight: 21, marginBottom: 16 },
  statsSubtitle: { color: colors.muted, fontSize: 11, marginTop: 3, marginBottom: 13 },
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
