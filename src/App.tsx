/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, FormEvent } from 'react';
import { 
  ShoppingBag, 
  User, 
  ChefHat, 
  Database, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight, 
  Clock, 
  Plus, 
  Minus, 
  Trash2, 
  Send, 
  Sparkles, 
  Sliders, 
  TrendingUp, 
  Check, 
  Activity, 
  Weight, 
  Gauge, 
  Thermometer, 
  Heart,
  ChevronRight,
  Package,
  Layers,
  ShoppingBag as CartIcon,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Shield
} from 'lucide-react';

import { 
  ProductItem, 
  SubscriptionPlan, 
  Order, 
  OrderItem, 
  Practiker, 
  Recipe, 
  DashboardMetrics, 
  DemandPrediction,
  CategoryType,
  OrderStatus
} from './types.js';

// Simple Markdown parser for AI insights on client and admin views.
function renderSimpleMarkdown(markdownText: string) {
  if (!markdownText) return null;
  
  const lines = markdownText.split('\n');
  return lines.map((line, idx) => {
    let text = line.trim();
    if (text.startsWith('### ')) {
      return (
        <h4 key={idx} className="text-lg font-bold text-practika mt-4 mb-2 border-b pb-1">
          {text.replace('### ', '')}
        </h4>
      );
    }
    if (text.startsWith('#### ')) {
      return (
        <h5 key={idx} className="text-md font-bold text-slate-800 mt-2 mb-1">
          {text.replace('#### ', '')}
        </h5>
      );
    }
    if (text.startsWith('* ') || text.startsWith('- ')) {
      const cleanLine = text.substring(2);
      return (
        <li key={idx} className="ml-4 list-disc text-sm text-slate-600 mb-1 leading-relaxed">
          {parseBoldText(cleanLine)}
        </li>
      );
    }
    if (text.startsWith('1.') || text.startsWith('2.') || text.startsWith('3.') || text.startsWith('4.')) {
      return (
        <li key={idx} className="ml-4 list-decimal text-sm text-slate-600 mb-1 leading-relaxed">
          {parseBoldText(text.replace(/^\d+\.\s*/, ''))}
        </li>
      );
    }
    if (text === '') {
      return <div key={idx} className="h-2"></div>;
    }
    return (
      <p key={idx} className="text-sm text-slate-600 mb-2 leading-relaxed">
        {parseBoldText(text)}
      </p>
    );
  });
}

function parseBoldText(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-semibold text-slate-900">{part}</strong> : part);
}

export default function App() {
  // --- APPLICATION STATE ---
  const [activeRole, setActiveRole] = useState<'cliente' | 'practiker' | 'admin'>('cliente');
  
  const [isPractikerLogged, setIsPractikerLogged] = useState<boolean>(() => {
    return localStorage.getItem('isPractikerLogged') === 'true';
  });
  const [isAdminLogged, setIsAdminLogged] = useState<boolean>(() => {
    return localStorage.getItem('isAdminLogged') === 'true';
  });

  // Login form state
  const [loginUser, setLoginUser] = useState<string>('');
  const [loginPass, setLoginPass] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  // Data State loaded from REST API
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionPlan[]>([]);
  const [practikers, setPractikers] = useState<Practiker[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  
  // Selected Subscriptions & Shopping Cart (Client)
  const [activeSuscId, setActiveSuscId] = useState<string>('sub-familiar');
  const [cart, setCart] = useState<{ product: ProductItem; q: number }[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState<string>('Calle 15 # 40-52, Barrio Barzal, Villavicencio');
  const [deliveryPhone, setDeliveryPhone] = useState<string>('3158941254');
  const [deliveryWindow, setDeliveryWindow] = useState<string>('08:00 - 12:00');
  const [deliveryDate, setDeliveryDate] = useState<string>('2026-06-11');
  const [activeCategory, setActiveCategory] = useState<string>('Todos');

  // Interactive UI Modal Alerts & Notification triggers
  const [globalNotif, setGlobalNotif] = useState<{ text: string; type: 'success' | 'warn' | 'info' } | null>(null);
  
  // Gemini Assistant State (Floating modal & Side chatter)
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [chefPrompt, setChefPrompt] = useState<string>('');
  const [assistantHistory, setAssistantHistory] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    { role: 'assistant', text: '¡Hola! Soy el Chef Álvaro de PRACTIKA. ¿Qué duda culinaria te gustaría resolver hoy acerca de nuestro alistamiento al vacío?' }
  ]);
  const [isChefLoading, setIsChefLoading] = useState<boolean>(false);
  
  // Operator Mode State
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>('op-01');
  const [activePreparingOrderId, setActivePreparingOrderId] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  
  // Gamified recipe workflow tracking
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [recipeChecklist, setRecipeChecklist] = useState<boolean[]>([]);
  
  // Quality telemetry inputs
  const [telemetryWeight, setTelemetryWeight] = useState<string>('510');
  const [telemetryPressure, setTelemetryPressure] = useState<string>('99.5');
  const [telemetryTemp, setTelemetryTemp] = useState<string>('165');
  const [telemetryTime, setTelemetryTime] = useState<string>('3.8');

  // Dispatch & Admin predictions state
  const [demandPrediction, setDemandPrediction] = useState<DemandPrediction | null>(null);
  const [isPredicting, setIsPredicting] = useState<boolean>(false);

  // Admin search and filters
  const [adminSearchQuery, setAdminSearchQuery] = useState<string>('');
  const [adminStatusFilter, setAdminStatusFilter] = useState<string>('Todos');
  const [adminDateFilter, setAdminDateFilter] = useState<string>('');

  // --- SECRET ADMIN SYSTEM & ACCOUNTS DYNAMIC CREATOR ---
  const [logoClicks, setLogoClicks] = useState<number>(0);
  const [isSecretAdminModalOpen, setIsSecretAdminModalOpen] = useState<boolean>(false);
  
  // --- CLIENT PERSISTENT ACCOUNT & REGISTRATION STATE ---
  const [activeClient, setActiveClient] = useState<{
    name: string;
    username: string;
    email: string;
    phone: string;
  } | null>(() => {
    const saved = localStorage.getItem('active_client');
    if (saved) {
      try { return JSON.parse(saved); } catch(e) {}
    }
    return null;
  });

  // Dynamic Registration / Entry Wizard
  const [setupMode, setSetupMode] = useState<'register' | 'login'>('register');
  const [setupName, setSetupName] = useState<string>('');
  const [setupUsername, setSetupUsername] = useState<string>('');
  const [setupEmail, setSetupEmail] = useState<string>('');
  const [setupPhone, setSetupPhone] = useState<string>('');
  const [setupPassword, setSetupPassword] = useState<string>('');
  const [setupError, setSetupError] = useState<string>('');
  const [isSystemInitialized, setIsSystemInitialized] = useState<boolean | null>(true);

  // Custom user lists
  const [users, setUsers] = useState<{username: string; role: 'practiker' | 'admin' | 'cliente'; name: string}[]>(() => {
    const saved = localStorage.getItem('practika_users');
    if (saved) {
      try { return JSON.parse(saved); } catch(e) {}
    }
    return [
      { username: 'operador', role: 'practiker', name: 'Operario Standard' },
      { username: 'practiker', role: 'practiker', name: 'Operario Principal' },
      { username: 'parking', role: 'practiker', name: 'Supervisor de Parking' },
      { username: 'cajero', role: 'admin', name: 'Cajero Central' },
      { username: 'admin', role: 'admin', name: 'Director SGC' },
    ];
  });

  const [passwords, setPasswords] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('practika_passwords');
    if (saved) {
      try { return JSON.parse(saved); } catch(e) {}
    }
    return {
      'operador': 'chef123',
      'practiker': 'chef123',
      'parking': 'chef123',
      'cajero': 'admin123',
      'admin': 'admin123',
    };
  });

  // New user manager form inputs
  const [newUsername, setNewUsername] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [newRole, setNewRole] = useState<'practiker' | 'admin'>('practiker');
  const [newName, setNewName] = useState<string>('');

  const checkSystemConfig = async () => {
    try {
      const res = await fetch('/api/users-config').then(r => r.json());
      setIsSystemInitialized(res.isInitialized);
      if (res.isInitialized && res.users && res.users.length > 0) {
        const fetchedUsers = res.users.map((u: any) => ({
          username: u.username,
          role: u.role,
          name: u.name
        }));
        const fetchedPasswords: Record<string, string> = {};
        res.users.forEach((u: any) => {
          fetchedPasswords[u.username] = u.password || 'chef123';
        });

        setUsers(fetchedUsers);
        setPasswords(fetchedPasswords);
        localStorage.setItem('practika_users', JSON.stringify(fetchedUsers));
        localStorage.setItem('practika_passwords', JSON.stringify(fetchedPasswords));
      }
    } catch (err) {
      console.error("Error reading system configuration from server:", err);
      // Fallback
      setIsSystemInitialized(true);
    }
  };

  const handleFirstTimeSetup = async (e: FormEvent) => {
    e.preventDefault();
    setSetupError('');
    const u = setupUsername.trim().toLowerCase();
    const p = setupPassword.trim();

    if (!u || !p) {
      setSetupError('El usuario de login y la contraseña son obligatorios.');
      return;
    }

    if (setupMode === 'register') {
      const n = setupName.trim();
      const em = setupEmail.trim();
      const ph = setupPhone.trim();

      if (!n || !em || !ph) {
        setSetupError('Todos los campos son estrictamente obligatorios (Nombre, Usuario, Email, Teléfono y Contraseña).');
        return;
      }

      try {
        const res = await fetch('/api/users/register-client', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: n, username: u, email: em, phone: ph, password: p })
        });
        const data = await res.json();
        if (!res.ok) {
          setSetupError(data.error || 'Ocurrió un error en el registro.');
          return;
        }

        const clientData = {
          name: n,
          username: u,
          email: em,
          phone: ph
        };
        setActiveClient(clientData);
        localStorage.setItem('active_client', JSON.stringify(clientData));
        localStorage.setItem('registered_client_backup', JSON.stringify(clientData));
        showNotification(`🚀 ¡Registro exitoso! Bienvenido @${u}. Guardado en el servidor.`, 'success');

        // Reset
        setSetupName('');
        setSetupUsername('');
        setSetupEmail('');
        setSetupPhone('');
        setSetupPassword('');
        
        await checkSystemConfig();
      } catch (err: any) {
        setSetupError('Error al contactar al servidor: ' + err.message);
      }
    } else {
      // Login Mode
      try {
        const res = await fetch('/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: u, password: p })
        });
        const data = await res.json();
        if (!res.ok) {
          setSetupError(data.error || 'Usuario o contraseña incorrectos.');
          return;
        }

        const clientData = {
          name: data.user.name || u,
          username: u,
          email: data.user.email || 'cliente@practika.co',
          phone: data.user.phone || '3120000000'
        };

        setActiveClient(clientData);
        localStorage.setItem('active_client', JSON.stringify(clientData));
        localStorage.setItem('registered_client_backup', JSON.stringify(clientData));

        if (data.user.role === 'admin') {
          setActiveRole('admin');
          setIsAdminLogged(true);
          localStorage.setItem('isAdminLogged', 'true');
        } else if (data.user.role === 'practiker') {
          setActiveRole('practiker');
          setIsPractikerLogged(true);
          localStorage.setItem('isPractikerLogged', 'true');
        } else {
          setActiveRole('cliente');
        }

        showNotification(`👋 ¡Bienvenido de nuevo, ${clientData.name}!`, 'success');
        setSetupUsername('');
        setSetupPassword('');
        await checkSystemConfig();
      } catch (err: any) {
        setSetupError('Error de red al iniciar sesión: ' + err.message);
      }
    }
  };

  const registerOrUpdateUser = async (username: string, role: 'practiker' | 'admin', name: string, pass: string) => {
    const u = username.trim().toLowerCase();
    if (!u || !pass || !name) {
      showNotification('Todos los campos son obligatorios para guardar el usuario.', 'warn');
      return;
    }
    
    // Create new structures
    const filtered = users.filter(usr => usr.username !== u);
    const newUsers = [...filtered, { username: u, role, name: name.trim() }];
    const newPass = { ...passwords, [u]: pass };

    // Format for server payload with passwords included
    const serverUsersPayload = newUsers.map(usr => ({
      ...usr,
      password: newPass[usr.username] || 'chef123'
    }));

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: serverUsersPayload })
      });
      if (res.ok) {
        setPasswords(newPass);
        localStorage.setItem('practika_passwords', JSON.stringify(newPass));
        setUsers(newUsers);
        localStorage.setItem('practika_users', JSON.stringify(newUsers));
        
        setNewUsername('');
        setNewPassword('');
        setNewName('');
        showNotification(`Usuario @${u} (${name}) guardado exitosamente en users_db.json.`, 'success');
      } else {
        showNotification('Error al sincronizar el usuario con el servidor.', 'warn');
      }
    } catch (e) {
      showNotification('Error de conexión al sincronizar con el servidor.', 'warn');
    }
  };

  const deleteUser = async (username: string) => {
    const u = username.toLowerCase();
    const newUsers = users.filter(usr => usr.username !== u);
    const newPass = { ...passwords };
    delete newPass[u];

    // Format for server payload
    const serverUsersPayload = newUsers.map(usr => ({
      ...usr,
      password: newPass[usr.username] || 'chef123'
    }));

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: serverUsersPayload })
      });
      if (res.ok) {
        setUsers(newUsers);
        localStorage.setItem('practika_users', JSON.stringify(newUsers));
        setPasswords(newPass);
        localStorage.setItem('practika_passwords', JSON.stringify(newPass));
        showNotification(`Usuario @${u} eliminado exitosamente.`, 'info');
      } else {
        showNotification('Error al eliminar el usuario en el servidor.', 'warn');
      }
    } catch (e) {
      showNotification('Error de conexión al eliminar en el servidor.', 'warn');
    }
  };

  // Filtered orders for central admin view
  const filteredAdminOrders = orders.filter(o => {
    const matchesSearch = adminSearchQuery.trim() === '' || 
      o.clientName.toLowerCase().includes(adminSearchQuery.toLowerCase()) || 
      o.id.toLowerCase().includes(adminSearchQuery.toLowerCase());
    
    const matchesStatus = adminStatusFilter === 'Todos' || o.status === adminStatusFilter;
    
    const matchesDate = adminDateFilter === '' || o.scheduledDeliveryDate === adminDateFilter;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // HACCP limits calculation for current selected recipe and active telemetry
  const haccpLimits = useMemo(() => {
    if (!selectedRecipe) return null;
    const targetPressure = selectedRecipe.vacuumSpecification.pressurePercent;
    const targetTemp = selectedRecipe.vacuumSpecification.temperatureCelsius;
    
    // Safety thresholds:
    // Pressure must be at least target - 2.5% and not above 100%
    const minPressure = targetPressure - 2.5;
    const maxPressure = 100;
    
    // Temperature must be within +/- 10°C of recipe standard
    const minTemp = targetTemp - 10;
    const maxTemp = targetTemp + 10;
    
    const parsedPressure = parseFloat(String(telemetryPressure || '').replace('%', '').trim());
    const parsedTemp = parseFloat(String(telemetryTemp || '').replace('°C', '').replace('C', '').trim());
    
    const isPressureOk = !isNaN(parsedPressure) && parsedPressure >= minPressure && parsedPressure <= maxPressure;
    const isTempOk = !isNaN(parsedTemp) && parsedTemp >= minTemp && parsedTemp <= maxTemp;
    
    return {
      targetPressure,
      targetTemp,
      minPressure,
      maxPressure,
      minTemp,
      maxTemp,
      parsedPressure,
      parsedTemp,
      isPressureOk,
      isTempOk,
      isValid: isPressureOk && isTempOk
    };
  }, [selectedRecipe, telemetryPressure, telemetryTemp]);

  // --- INITIAL DATA SYNC ---
  useEffect(() => {
    checkSystemConfig();
    loadAllData();
    // Poll updates every 10 seconds to keep roles and configs synchronized automatically
    const interval = setInterval(() => {
      checkSystemConfig();
      loadAllData();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadAllData = async () => {
    try {
      const [resProd, resSub, resOp, resRec, resOrd, resMet] = await Promise.all([
        fetch('/api/products').then(res => res.json()),
        fetch('/api/subscriptions').then(res => res.json()),
        fetch('/api/practikers').then(res => res.json()),
        fetch('/api/recipes').then(res => res.json()),
        fetch('/api/orders').then(res => res.json()),
        fetch('/api/metrics').then(res => res.json()),
      ]);

      setProducts(resProd);
      setSubscriptions(resSub);
      setPractikers(resOp);
      setRecipes(resRec);
      setOrders(resOrd);
      setMetrics(resMet);
    } catch (err) {
      console.error('Error fetching dashboard REST APIs: ', err);
    }
  };

  const showNotification = (text: string, type: 'success' | 'warn' | 'info' = 'success') => {
    setGlobalNotif({ text, type });
    setTimeout(() => {
      setGlobalNotif(null);
    }, 4500);
  };

  // --- CLIENT EVENTS / MUTATIONS ---
  const handleAddToCard = (product: ProductItem) => {
    const existing = cart.find(c => c.product.id === product.id);
    if (existing) {
      setCart(cart.map(c => c.product.id === product.id ? { ...c, q: c.q + 1 } : c));
    } else {
      setCart([...cart, { product, q: 1 }]);
    }
    showNotification(`Añadido ${product.name} a su alistamiento`, 'success');
  };

  const updateCartQuantity = (prodId: string, delta: number) => {
    const next = cart.map(item => {
      if (item.product.id === prodId) {
        return { ...item, q: item.q + delta };
      }
      return item;
    }).filter(item => item.q > 0);
    setCart(next);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      showNotification('Su canasta de alistamiento está vacía.', 'warn');
      return;
    }

    const plan = subscriptions.find(s => s.id === activeSuscId);
    const orderItems: OrderItem[] = cart.map(c => ({
      productId: c.product.id,
      name: c.product.name,
      quantity: c.q,
      weightGrams: c.product.weightGrams
    }));

    const totalAmount = cart.reduce((sum, c) => sum + (c.product.price * c.q), 0);

    const payload = {
      clientName: activeClient ? activeClient.name : 'Alejandro Galindo (Suscrito)',
      clientEmail: activeClient ? activeClient.email : 'lealandres007@gmail.com',
      clientAddress: deliveryAddress,
      clientPhone: activeClient ? activeClient.phone : deliveryPhone,
      planId: plan?.id,
      items: orderItems,
      totalAmount: totalAmount,
      scheduledDeliveryDate: deliveryDate,
      deliveryWindow: deliveryWindow
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const newOrder = await res.json();
        showNotification(`¡Alistamiento Agendado Exitosamente! Su pedido es el ${newOrder.id}.`, 'success');
        setCart([]); // Clear cart
        loadAllData(); // Refresh list immediately
      } else {
        showNotification('Ocurrió un error al procesar el pedido.', 'warn');
      }
    } catch (err) {
      showNotification('Error al contactar al servidor PRACTIKA.', 'warn');
    }
  };

  // --- CREDENTIALS AUTHENTICATION HANDLERS ---
  const handlePortalLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const username = loginUser.trim().toLowerCase();
    const password = loginPass;

    if (!username || !password) {
      setLoginError('Por favor ingrese tanto el usuario como la contraseña.');
      return;
    }

    if (activeRole === 'practiker') {
      const matchedUser = users.find(u => u.username === username && u.role === 'practiker');
      const correctPass = passwords[username];
      
      if (matchedUser && correctPass === password) {
        setIsPractikerLogged(true);
        localStorage.setItem('isPractikerLogged', 'true');
        setLoginUser('');
        setLoginPass('');
        showNotification(`¡Acceso autorizado! Operador ${matchedUser.name} activo.`, 'success');
      } else {
        setLoginError('Credenciales incorrectas para el Modo Operador de Planta (Practiker). Intente de nuevo.');
      }
    } else if (activeRole === 'admin') {
      const matchedUser = users.find(u => u.username === username && u.role === 'admin');
      const correctPass = passwords[username];
      
      if (matchedUser && correctPass === password) {
        setIsAdminLogged(true);
        localStorage.setItem('isAdminLogged', 'true');
        setLoginUser('');
        setLoginPass('');
        showNotification(`¡Acceso autorizado! Administrador ${matchedUser.name} activo.`, 'success');
      } else {
        setLoginError('Credenciales incorrectas para Jefe de Cocina / Caja Central. Intente de nuevo.');
      }
    }
  };

  // --- OPERATOR EVENTS / MUTATIONS ---
  const handleClaimOrder = async (orderId: string) => {
    const currentOp = practikers.find(p => p.id === selectedOperatorId);
    if (!currentOp) return;

    try {
      const res = await fetch(`/api/orders/${orderId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operatorId: currentOp.id,
          operatorName: currentOp.name
        })
      });
      if (res.ok) {
        showNotification(`Te has asignado el pedido ${orderId}. ¡Manos a la obra!`, 'success');
        loadAllData();
      }
    } catch (err) {
      showNotification('Error al autoasignarse el pedido.', 'warn');
    }
  };

  const handleStartPreparation = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/start-prep`, {
        method: 'POST'
      });
      if (res.ok) {
        setActivePreparingOrderId(orderId);
        
        // Find corresponding recipe for the first product in order (if available)
        const orderObj = orders.find(o => o.id === orderId);
        if (orderObj && orderObj.items.length > 0) {
          const firstProdId = orderObj.items[0].productId;
          const matchedRecipe = recipes.find(r => r.productId === firstProdId);
          if (matchedRecipe) {
            setSelectedRecipe(matchedRecipe);
            setRecipeChecklist(new Array(matchedRecipe.steps.length).fill(false));
            setCurrentStepIndex(0);
            
            // Set default suggested values of vaccine telemetry
            setTelemetryWeight(String(orderObj.items[0].quantity * matchedRecipe.ingredients[0]?.quantity * 100 || 500));
            setTelemetryPressure(String(matchedRecipe.vacuumSpecification.pressurePercent));
            setTelemetryTemp(String(matchedRecipe.vacuumSpecification.temperatureCelsius));
            setTelemetryTime(String(matchedRecipe.vacuumSpecification.sealingTimeSeconds));
          } else {
            setSelectedRecipe(null);
          }
        }
        showNotification('Fase de preparación iniciada. Sigue la receta en pantalla.', 'info');
        loadAllData();
      }
    } catch (err) {
      showNotification('Error al iniciar cocina.', 'warn');
    }
  };

  const handleCompletePackaging = async () => {
    if (!activePreparingOrderId) return;
    
    const telemetry = {
      batchCode: `LOTE-PK-${new Date().toISOString().slice(5,10).replace('-','')}-${Math.floor(100 + Math.random() * 900)}`,
      verifiedScaledWeight: parseFloat(telemetryWeight) || 500,
      verifiedVacuumPressure: parseFloat(telemetryPressure) || 99.2,
      verifiedSealTemperature: parseFloat(telemetryTemp) || 160,
      verifiedSealTime: parseFloat(telemetryTime) || 3.5
    };

    try {
      const res = await fetch(`/api/orders/${activePreparingOrderId}/complete-packaging`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telemetry)
      });
      if (res.ok) {
        showNotification('¡Empaque Listo! Certificación de calidad registrada bajo norma HACCP.', 'success');
        setActivePreparingOrderId(null);
        setSelectedRecipe(null);
        loadAllData();
      }
    } catch (err) {
      showNotification('Error al guardar empaque de calidad.', 'warn');
    }
  };

  const handleReportStockAlert = async (opId: string, ingredientName: string, isDepleted: boolean) => {
    try {
      const res = await fetch(`/api/practikers/${opId}/stock-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredientName, isDepleted })
      });
      if (res.ok) {
        showNotification(`Alerta de micro-inventario para "${ingredientName}" enviada al Chef Álvaro.`, 'success');
        loadAllData();
      }
    } catch (err) {
      showNotification('Error al reportar alerta de stock.', 'warn');
    }
  };

  // --- ADMIN/CHEF EVENTS / MUTATIONS ---
  const handleDeliver = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/deliver`, {
        method: 'POST'
      });
      if (res.ok) {
        showNotification(`Pedido ${orderId} despachado y entregado.`, 'success');
        loadAllData();
      }
    } catch (err) {
      showNotification('Error al realizar despacho.', 'warn');
    }
  };

  const handleRunDemandForecast = async () => {
    setIsPredicting(true);
    try {
      const res = await fetch('/api/gemini/predict-demand', {
        method: 'POST'
      });
      if (res.ok) {
        const prediction: DemandPrediction = await res.json();
        setDemandPrediction(prediction);
        showNotification('IA Generativa predijo la demanda con éxito.', 'success');
      } else {
        showNotification('No se pudo invocar el módulo IA Predictivo.', 'warn');
      }
    } catch (err) {
      showNotification('Error al contactar motor inteligente.', 'warn');
    } finally {
      setIsPredicting(false);
    }
  };

  // --- GEMINI CO-PILOT CHAT ASSISTANT ---
  const handleAskChefAlvaro = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chefPrompt.trim()) return;

    const userMsg = chefPrompt;
    setAssistantHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setChefPrompt('');
    setIsChefLoading(true);

    try {
      const res = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMsg,
          chatterRole: activeRole === 'practiker' ? 'practiker' : 'cliente',
          contextProduct: selectedRecipe ? selectedRecipe.productName : undefined
        })
      });
      const data = await res.json();
      if (data.text) {
        setAssistantHistory(prev => [...prev, { role: 'assistant', text: data.text }]);
      } else if (data.error) {
        setAssistantHistory(prev => [...prev, { role: 'assistant', text: `Disculpa, tengo un conflicto de transmisión regional: ${data.error}` }]);
      }
    } catch (err) {
      setAssistantHistory(prev => [...prev, { role: 'assistant', text: 'Vaya, parece que mi receta tuvo un pequeño percance logístico temporario.' }]);
    } finally {
      setIsChefLoading(false);
    }
  };

  const handlePredefinedQuickMsg = (msg: string) => {
    setChefPrompt(msg);
  };

  // Filter products on frontend
  const filteredProducts = activeCategory === 'Todos' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  const selectedSubscription = subscriptions.find(s => s.id === activeSuscId);

  // Stats for the interface
  const totalCartPrice = cart.reduce((sum, c) => sum + (c.product.price * c.q), 0);

  if (isSystemInitialized === null) {
    return (
      <div id="practika-loader" className="min-h-screen bg-[#faf7f5] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-practika border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Iniciando Servidor local...</p>
        </div>
      </div>
    );
  }

  // If client is not configured/registered, they must sign up or login first
  if (activeClient === null) {
    return (
      <div id="practika-first-time-setup" className="min-h-screen bg-[#faf7f5] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 space-y-6 text-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full -translate-y-8 translate-x-8"></div>
          
          {/* BOTÓN DE RETROCESO (CON CONTROL DE REGISTRO PREVIO) */}
          <div className="flex justify-between items-center relative z-10 border-b border-slate-100 pb-3">
            {localStorage.getItem('registered_client_backup') ? (
              <button
                type="button"
                onClick={() => {
                  const backup = localStorage.getItem('registered_client_backup');
                  if (backup) {
                    try {
                      const client = JSON.parse(backup);
                      setActiveClient(client);
                      showNotification(`Regresando al menú principal: @${client.username}`, 'success');
                    } catch (e) {}
                  }
                }}
                className="flex items-center gap-1.5 text-xs font-black text-orange-700 hover:text-orange-950 bg-orange-100/60 hover:bg-orange-100 px-3.5 py-2 rounded-xl transition duration-150 cursor-pointer"
              >
                ⬅️ Volver al Menú Principal
              </button>
            ) : (
              <div 
                className="flex items-center gap-1.5 text-[12px] font-black text-slate-400 bg-slate-150/50 border border-slate-200 px-3 py-1.5 rounded-xl select-none"
                title="Debe registrar una cuenta antes de acceder al menú principal"
              >
                🚫 Retorno Bloqueado (Falta Registro)
              </div>
            )}

            <span className="text-[12px] text-slate-450 font-bold uppercase tracking-wider font-mono">
              PARQUESOFT META
            </span>
          </div>

          <div className="text-center relative z-10">
            <div className="w-14 h-14 bg-practika rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-md mx-auto mb-3">
              P
            </div>
            <h2 className="text-xl font-black text-practika">
              {setupMode === 'register' ? 'Registro de Cliente' : 'Iniciar Sesión'}
            </h2>
            <p className="text-[12px] text-orange-700 font-extrabold uppercase tracking-widest mt-0.5">
              Identidad de Operaciones PRACTIKA
            </p>
            <p className="text-xs text-slate-500 leading-normal mt-3">
              {setupMode === 'register' 
                ? 'Bienvenido a PRACTIKA. Cree su cuenta de usuario para almacenar sus datos y realizar sus pedidos de alistamiento al vacío.'
                : 'Ingrese sus credenciales de usuario registrado de PRACTIKA para continuar.'}
            </p>
          </div>

          <form onSubmit={handleFirstTimeSetup} className="space-y-4 relative z-10">
            {setupError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-bold text-center">
                ⚠️ {setupError}
              </div>
            )}

            {setupMode === 'register' && (
              <>
                <div>
                  <label className="block text-[11px] font-black text-slate-450 uppercase tracking-wider mb-1">
                    Nombre Completo (Cliente)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Alejandro Galindo"
                    value={setupName}
                    onChange={(e) => setSetupName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-practika text-xs px-3.5 py-2.5 rounded-xl font-bold outline-none transition text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-450 uppercase tracking-wider mb-1">
                    Email / Correo de contacto
                  </label>
                  <input
                    type="email"
                    placeholder="Ej. sucorreo@ejemplo.com"
                    value={setupEmail}
                    onChange={(e) => setSetupEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-practika text-xs px-3.5 py-2.5 rounded-xl font-bold outline-none transition text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-450 uppercase tracking-wider mb-1">
                    Número de Teléfono
                  </label>
                  <input
                    type="tel"
                    placeholder="Ej. 3158941254"
                    value={setupPhone}
                    onChange={(e) => setSetupPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-practika text-xs px-3.5 py-2.5 rounded-xl font-mono font-bold outline-none transition text-slate-800"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-black text-slate-450 uppercase tracking-wider mb-1">
                Nombre de Usuario (Login / Nick)
              </label>
              <input
                type="text"
                placeholder="Ej. lealandres007"
                value={setupUsername}
                onChange={(e) => setSetupUsername(e.target.value.replace(/\s+/g, ''))}
                className="w-full bg-slate-50 border border-slate-200 focus:border-practika text-xs px-3.5 py-2.5 rounded-xl font-mono font-black text-orange-950 outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-450 uppercase tracking-wider mb-1">
                Contraseña de Seguridad
              </label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={setupPassword}
                onChange={(e) => setSetupPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-practika text-xs px-3.5 py-2.5 rounded-xl font-mono font-black text-slate-800 outline-none transition"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-practika hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition shadow-md hover:shadow-orange-500/10 duration-150 cursor-pointer"
            >
              {setupMode === 'register' ? '🛠️ Registrar Mi Cuenta en SGC' : '🔑 Ingresar al Portal'}
            </button>
          </form>

          <div className="text-center space-y-4 pt-2 relative z-10">
            <button
              type="button"
              onClick={() => {
                setSetupMode(setupMode === 'register' ? 'login' : 'register');
                setSetupError('');
              }}
              className="text-orange-700 hover:text-orange-900 text-xs font-extrabold hover:underline transition duration-150"
            >
              {setupMode === 'register' 
                ? '¿Ya tienes una cuenta? Iniciar Sesión' 
                : '¿No te has registrado? Crear una Cuenta'}
            </button>

            <div className="border-t border-slate-100 pt-4 flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                🔒 Personal Autorizado (Sin cuenta cliente)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const mockClient = {
                      name: 'Supervisor de Planta (PRACTIKA)',
                      username: 'operador',
                      email: 'operaciones@practika.co',
                      phone: '3150000000'
                    };
                    setActiveClient(mockClient);
                    localStorage.setItem('active_client', JSON.stringify(mockClient));
                    setActiveRole('practiker');
                    setIsPractikerLogged(true);
                    localStorage.setItem('isPractikerLogged', 'true');
                    showNotification('Iniciando estación de Operario directo...', 'info');
                  }}
                  className="bg-teal/10 hover:bg-teal/20 text-teal-800 font-black py-2 rounded-xl text-[12px] transition duration-150 cursor-pointer"
                >
                  👩‍🍳 Modo Operario
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const mockClient = {
                      name: 'Director del Sistema (SGC)',
                      username: 'admin',
                      email: 'sgc@practika.co',
                      phone: '3120000000'
                    };
                    setActiveClient(mockClient);
                    localStorage.setItem('active_client', JSON.stringify(mockClient));
                    setActiveRole('admin');
                    setIsAdminLogged(true);
                    localStorage.setItem('isAdminLogged', 'true');
                    showNotification('Iniciando estación de Caja Central...', 'info');
                  }}
                  className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-700 font-black py-2 rounded-xl text-[12px] transition duration-150 cursor-pointer"
                >
                  📊 Modo Caja Central
                </button>
              </div>
            </div>
          </div>

          <p className="text-[12px] text-center text-slate-400 font-medium">
            PRACTIKA Co-Op • ParqueSoft Meta SGC
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="practika-main" className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* GLOBAL NOTIFICATION INSIGHT POPUP */}
      {globalNotif && (
        <div id="toast-notif" className="fixed bottom-6 right-6 z-50 glass border-l-4 border-vibrant p-4 rounded-xl shadow-xl max-w-sm animate-bounce flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-vibrant shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-practika uppercase tracking-wider">PRACTIKA HUB</p>
            <p className="text-sm font-medium text-slate-800">{globalNotif.text}</p>
          </div>
        </div>
      )}

      {/* HEADER BAR (VIBRANT THEME) */}
      <header id="app-header" className="h-20 bg-practika flex items-center justify-between px-6 md:px-10 shadow-md shrink-0 text-white border-b border-orange-950/40">
        <div 
          className="flex items-center gap-3 cursor-pointer select-none"
          onClick={() => {
            setLogoClicks(c => {
              if (c + 1 >= 5) {
                setIsSecretAdminModalOpen(true);
                showNotification('🔑 ¡Entrada de Administrador habilitada!', 'success');
                return 0;
              }
              return c + 1;
            });
          }}
          title="Click 5 veces para acceso administrativo"
        >
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center font-black text-2xl text-white shadow-md hover:scale-105 active:scale-95 transition-all duration-150">
            P
          </div>
          <div>
            <span className="text-2xl font-bold tracking-tight text-white block leading-none">PRACTIKA</span>
            <span className="text-[12px] tracking-widest text-orange-300 font-bold block mt-1 uppercase">Alistamiento al Vacío</span>
          </div>
        </div>

        {/* PROFILE HEADER TAG */}
        <div className="hidden lg:flex items-center gap-4">
          <div className="text-right">
            <span className="text-[12px] bg-white/10 px-2.5 py-0.5 rounded-full text-orange-100 font-black tracking-wider border border-white/5 uppercase block">
              {activeRole === 'cliente' && 'Suscrito / Premium'}
              {activeRole === 'practiker' && 'Certificación HACV'}
              {activeRole === 'admin' && 'Caja Central'}
            </span>
            <span className="text-xs font-bold text-white block mt-0.5">
              {activeRole === 'cliente' && activeClient ? activeClient.name : 'Alejandro Galindo'}
              {activeRole === 'practiker' && 'Operante de Planta'}
              {activeRole === 'admin' && 'Caja Central / SGC'}
            </span>
          </div>
          <div className="w-9 h-9 bg-orange-700 rounded-full border border-orange-500/40 flex items-center justify-center text-white font-extrabold text-xs shadow-md select-none leading-none shrink-0">
            {(() => {
              if (activeRole === 'cliente' && activeClient) {
                return activeClient.name.substring(0, 2).toUpperCase();
              }
              return 'OP';
            })()}
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('active_client');
              localStorage.removeItem('isPractikerLogged');
              localStorage.removeItem('isAdminLogged');
              setActiveClient(null);
              setIsPractikerLogged(false);
              setIsAdminLogged(false);
              setActiveRole('cliente');
              showNotification('Sesión finalizada. Regrese cuando lo desee.', 'info');
            }}
            title="Cerrar Sesión / Salir"
            className="text-[12px] bg-orange-600 hover:bg-orange-700 px-3 py-1.5 rounded-xl text-white font-black uppercase tracking-wider transition border border-orange-500/35 cursor-pointer leading-none"
          >
            Salir
          </button>
        </div>
      </header>

      {/* SUB-HEADER OR ALERT LOGS OF THE COMMUNITY PLATFORM COOPERATIVE */}
      <div className="bg-[#140603] text-slate-300 py-2 px-6 md:px-10 text-xs flex justify-between items-center overflow-x-auto whitespace-nowrap border-b border-orange-950/40">
        <div className="flex items-center gap-4">
          <span className="text-orange-400 font-black tracking-wider text-[11px] uppercase px-2 py-0.5 rounded bg-orange-500/15 border border-orange-500/20">
            PARQUESOFT META CO-OP
          </span>
          <span className="opacity-90 font-medium">
            {activeRole === 'cliente' && "🍽️ Alistando materias primas frescas locales para Villavicencio."}
            {activeRole === 'practiker' && `👨‍🍳 Operando en: ${practikers.find(p=>p.id === selectedOperatorId)?.locationName || 'Hub principal'}`}
            {activeRole === 'admin' && "📊 Panel Directivo - Control de mermas e inocuidad alimentaria."}
          </span>
        </div>
        <div className="flex items-center gap-4 text-[13px]">
          <span className="flex items-center gap-1.5 text-orange-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></span>
            Sincronización Multilateral Activa
          </span>
          <span className="text-slate-500 font-mono">Villavicencio, Col</span>
        </div>
      </div>

      {/* CORE FRAMEWORK WORKSPACE */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {((activeRole === 'practiker' && !isPractikerLogged) || (activeRole === 'admin' && !isAdminLogged)) ? (
          <div className="flex-1 bg-slate-50 flex items-center justify-center p-6 md:p-12 overflow-y-auto animate-fade-in my-auto">
            <div id="secure-login-container" className="w-full max-w-md bg-white border border-slate-200/80 rounded-[2.5rem] shadow-xl p-8 relative overflow-hidden transition-all">
              {/* Decorative premium badge */}
              <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-orange-500 to-amber-500"></div>
              
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-orange-100/80 text-orange-650 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-orange-200/40 shadow-inner">
                  <Lock className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-practika tracking-tight">Acceso de Personal Autorizado</h3>
                <p className="text-xs text-slate-400 font-extrabold uppercase tracking-wider mt-1">SGC & CONTROL DE OPERACIONES</p>
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-orange-50 border border-orange-500/10 rounded-full">
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></span>
                  <span className="text-[12px] font-bold text-orange-800 uppercase tracking-wide">
                    {activeRole === 'practiker' ? 'Modo Operador de Planta (Practiker / Parking Operator)' : 'Administrativo / Caja Central (Central Cashier)'}
                  </span>
                </div>
              </div>

              {loginError && (
                <div className="mb-4.5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl font-medium leading-relaxed flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handlePortalLogin} className="space-y-4">
                <div>
                  <label className="block text-[12px] font-black text-slate-550 uppercase tracking-widest mb-1.5">
                    Usuario de Acceso
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={loginUser}
                      onChange={(e) => setLoginUser(e.target.value)}
                      placeholder={activeRole === 'practiker' ? 'Ej. operador' : 'Ej. cajero o admin'}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-xs px-3.5 py-3 rounded-2xl font-bold text-slate-700 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-black text-slate-555 uppercase tracking-widest mb-1.5">
                    Contraseña de Seguridad
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-xs pl-3.5 pr-10 py-3 rounded-2xl font-bold text-slate-700 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition shadow-md flex items-center justify-center gap-2 mt-2 outline-none"
                >
                  <Unlock className="w-4 h-4" /> Validar Llave & Ingresar
                </button>
              </form>

              {/* DEMO CREDENTIALS TOOLTIP */}
              <div className="mt-5 p-4 bg-orange-50/60 border border-orange-500/10 rounded-2xl">
                <p className="text-[12px] font-black text-orange-950 uppercase tracking-widest flex items-center gap-1">
                  🔑 Credenciales Certificadas:
                </p>
                <div className="mt-2 text-[13px] text-slate-600 font-medium">
                  {activeRole === 'practiker' ? (
                    <div>
                      <p className="font-bold text-slate-850">Estación Operador (Parking Operator Mode):</p>
                      <p className="font-mono text-slate-500 mt-0.5">Usuario: <span className="font-bold text-orange-700 bg-orange-100/50 px-1 py-0.5 rounded">operador</span> o <span className="font-bold text-orange-700 bg-orange-100/50 px-1 py-0.5 rounded">practiker</span></p>
                      <p className="font-mono text-slate-500 mt-0.5">Clave: <span className="font-bold text-orange-700 bg-orange-100/50 px-1 py-0.5 rounded">chef123</span></p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-bold text-slate-850">Estación Caja Central (Central Cashier / Admin):</p>
                      <p className="font-mono text-slate-500 mt-0.5">Usuario: <span className="font-bold text-orange-700 bg-orange-100/50 px-1 py-0.5 rounded">cajero</span> o <span className="font-bold text-orange-700 bg-orange-100/50 px-1 py-0.5 rounded">admin</span></p>
                      <p className="font-mono text-slate-500 mt-0.5">Clave: <span className="font-bold text-orange-700 bg-orange-100/50 px-1 py-0.5 rounded">admin123</span></p>
                    </div>
                  )}
                </div>
              </div>

              {/* Return to home button */}
              <div className="mt-5 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setActiveRole('cliente');
                    setLoginError('');
                    setLoginUser('');
                    setLoginPass('');
                  }}
                  className="text-xs font-bold text-orange-900 hover:text-orange-950 underline underline-offset-4"
                >
                  Volver a Vista de Cliente General
                </button>
              </div>

            </div>
          </div>
        ) : (
          <>
            {/* SIDEBAR CONTAINER */}
            <aside id="app-sidebar" className="w-full lg:w-80 bg-white border-r border-slate-200 p-6 flex flex-col gap-6 shrink-0 overflow-y-auto">
          
          {/* USER INTERFACE PROFILE-SPECIFIC CARDS AT SIDEBAR */}
          {activeRole === 'cliente' && (
            <>
              <div id="client-sub-detail-card" className="p-6 bg-gradient-to-b from-orange-50/60 to-orange-50/10 rounded-3xl border border-orange-500/10 shadow-sm relative overflow-hidden">
                <p className="text-[11px] font-black text-orange-850 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Tu Suscripción Activa
                </p>
                <h3 className="text-lg font-extrabold text-practika">
                  {selectedSubscription ? selectedSubscription.name : 'Plan Familiar Conveniencia'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-normal">
                  {selectedSubscription ? selectedSubscription.description : '30 días de alistamiento'}
                </p>
                
                {/* PROGRESS SEGMENT */}
                <div className="mt-4">
                  <div className="flex justify-between items-center text-xs text-slate-500 mb-1.5 font-bold">
                    <span>Alistados Consumidos</span>
                    <span className="text-teal font-extrabold">14 / 20 Porciones</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-600 w-2/3 transition-all duration-500"></div>
                  </div>
                  <p className="text-[12px] text-slate-400 mt-2 font-medium">
                    Su cupo se renueba el 24 de este mes ($ {selectedSubscription?.priceMonthly.toLocaleString()} COP)
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/50 flex gap-2">
                  <button 
                    onClick={() => showNotification("Suscripción pausada temporalmente por el ciclo actual.", "info")} 
                    className="flex-1 text-[12px] font-black bg-slate-200/70 text-slate-600 py-2 rounded-lg hover:bg-slate-200 transition duration-150 uppercase tracking-wider"
                  >
                    Pausar
                  </button>
                  <button 
                    onClick={() => showNotification("Su suscripción se cancelará al finalizar el período actual.", "warn")} 
                    className="flex-1 text-[12px] font-black border border-red-200 text-red-600 py-2 rounded-lg hover:bg-red-50 transition duration-150 uppercase tracking-wider"
                  >
                    Cancelar
                  </button>
                </div>
              </div>

              {/* NEXT PACKAGE SPECIFICATION */}
              {(() => {
                const parsedDate = deliveryDate ? new Date(deliveryDate + "T12:00:00") : new Date();
                const displayDay = parsedDate.getDate() || 11;
                const displayMonthList = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
                const displayMonth = displayMonthList[parsedDate.getMonth()] || "JUN";
                return (
                  <div id="next-delivery-card" className="flex flex-col gap-3">
                    <h4 className="text-xs font-bold text-practika uppercase tracking-wider mb-1">
                      Próxima Entrega Programada
                    </h4>
                    <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="bg-vibrant text-white w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0">
                          <span className="text-[11px] font-bold leading-none">{displayMonth}</span>
                          <span className="text-lg font-black leading-none">{displayDay}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-practika text-sm truncate">{deliveryDate}</p>
                          <p className="text-xs font-semibold text-vibrant mt-0.5 flex items-center gap-1">
                            <span>🕒 {deliveryWindow}</span>
                          </p>
                          <p className="text-[12px] text-slate-500 mt-0.5">
                            Sede: Villavicencio (Carlos)
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* INTERACTIVE MULTIPLE WINDOWS SELECTOR */}
                    <div className="bg-white border border-slate-200/60 p-4 rounded-2xl shadow-sm">
                      <p className="text-[12px] font-black text-practika uppercase tracking-widest mb-2.5 flex items-center gap-1">
                        ⏱️ Seleccionar Ventana de Horario
                      </p>
                      
                      {/* Interactive Schedule Slots Grid */}
                      <div className="grid grid-cols-1 gap-1.5 max-h-44 overflow-y-auto pr-1">
                        {[
                          { value: "06:00 - 08:00", label: "Temprano am (06-08)", icon: "🌅" },
                          { value: "08:00 - 10:00", label: "Mañana Temprano (08-10)", icon: "☀️" },
                          { value: "10:00 - 12:00", label: "Media Mañana (10-12)", icon: "🌤️" },
                          { value: "12:00 - 14:00", label: "Medio Día/Almuerzo (12-14)", icon: "🕛" },
                          { value: "14:00 - 16:00", label: "Tarde Temprano (14-16)", icon: "🌇" },
                          { value: "16:00 - 18:00", label: "Tarde/Cierre (16-18)", icon: "🌆" },
                          { value: "18:00 - 20:00", label: "Noche/Cena (18-20)", icon: "🌃" }
                        ].map((slot) => {
                          const isSelected = deliveryWindow === slot.value;
                          return (
                            <button
                              key={slot.value}
                              onClick={() => {
                                setDeliveryWindow(slot.value);
                                showNotification(`Horario de entrega actualizado a las ${slot.value}`, "success");
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-xl text-[13px] font-bold flex items-center justify-between transition-all duration-200 ${
                                isSelected 
                                  ? 'bg-vibrant/15 border border-vibrant text-vibrant shadow-sm' 
                                  : 'bg-slate-50 border border-slate-200/60 text-slate-600 hover:bg-slate-100/80 hover:text-orange-950'
                              }`}
                            >
                              <span className="flex items-center gap-1.5">
                                <span className="text-xs select-none">{slot.icon}</span>
                                <span>{slot.label}</span>
                              </span>
                              {isSelected && (
                                <span className="w-1.5 h-1.5 rounded-full bg-vibrant"></span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Interactive Date Quick Picker */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                          Ajustar Fecha:
                        </label>
                        <input 
                          type="date" 
                          value={deliveryDate}
                          onChange={(e) => {
                            setDeliveryDate(e.target.value);
                            showNotification(`Fecha de entrega cambiada al ${e.target.value}`, "info");
                          }}
                          className="text-[13px] font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:border-vibrant cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* BENEFIT ACCRUED CO-OP */}
              <div className="p-6 bg-practika rounded-3xl text-white mt-auto relative overflow-hidden">
                <div className="absolute right-[-10px] bottom-[-10px] text-white/5 font-black text-8xl pointer-events-none uppercase">
                  Zero
                </div>
                <p className="text-[12px] text-[#A6E1E4] mb-1 uppercase font-bold tracking-widest flex items-center gap-1">
                  <Heart className="w-3 h-3 text-red-400 fill-red-400" /> Co-Op Ahorro este mes
                </p>
                <p className="text-3xl font-black">18h</p>
                <p className="text-xs text-[#C6EBEC]">de cocina y mermas a cero (Zero Waste)</p>
              </div>
            </>
          )}

          {activeRole === 'practiker' && (
            <>
              {/* OPERATOR MANAGER SELECTOR */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm text-center">
                <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Identidad del Operario
                </p>
                <select 
                  value={selectedOperatorId} 
                  onChange={(e) => {
                    setSelectedOperatorId(e.target.value);
                    setActivePreparingOrderId(null);
                    setSelectedRecipe(null);
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-practika focus:outline-none focus:ring-1 focus:ring-vibrant"
                >
                  {practikers.map(op => (
                    <option key={op.id} value={op.id}>
                      🧑‍🍳 {op.name} ({op.completedOrdersCount} desb)
                    </option>
                  ))}
                </select>
                <div className="mt-2 flex items-center justify-center gap-1 text-xs">
                  <span className="text-amber-500 font-bold">★ {practikers.find(p=>p.id === selectedOperatorId)?.rating || '4.9'}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-600">Carga: {practikers.find(p=>p.id === selectedOperatorId)?.currentWorkload || '0'} p</span>
                </div>
              </div>

              {/* MICRO-INVENTARIO ALERT PANEL */}
              <div>
                <h4 className="text-xs font-bold text-practika uppercase tracking-wider mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Micro-Inventario
                </h4>
                <p className="text-[13px] text-slate-500 mb-3 leading-relaxed">
                  Monitorea tus existencias locales y reporta deficiencias al Chef Central:
                </p>
                
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {practikers.find(p => p.id === selectedOperatorId)?.rawIngredientsStock.map((stock, i) => (
                    <div key={i} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs transition-all">
                      <div className="truncate pr-1">
                        <p className="font-bold text-slate-700 truncate">{stock.ingredientName}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`w-2 h-2 rounded-full ${stock.stockLevelPercent > 40 ? 'bg-orange-500' : 'bg-red-500'}`}></span>
                          <span className="text-[12px] font-semibold text-slate-500">{stock.stockLevelPercent}% Disp.</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleReportStockAlert(selectedOperatorId, stock.ingredientName, stock.stockLevelPercent > 10)}
                        className={`px-2 py-1 rounded text-[11px] font-bold transition ${
                          stock.stockLevelPercent > 10 
                            ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                            : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                        }`}
                      >
                        {stock.stockLevelPercent > 10 ? '¡Vaciar!' : '¡Surtir!'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* GAME STATS BOX */}
              <div className="mt-auto p-4 bg-teal/10 border border-teal/20 rounded-2xl">
                <p className="text-[12px] font-bold text-teal uppercase tracking-widest mb-1">
                  Bono de Calidad Co-Op
                </p>
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-black text-practika">$125K</span>
                  <span className="text-xs text-slate-500 font-semibold">Consolidado</span>
                </div>
                <p className="text-[12px] text-slate-500 mt-1 leading-snug">
                  Mantener mermas debajo del 3% y vacíos perfectos genera bonos colectivos.
                </p>
              </div>

              <button
                onClick={() => {
                  setIsPractikerLogged(false);
                  localStorage.removeItem('isPractikerLogged');
                  setActiveRole('cliente');
                  showNotification('Sesión del Operario cerrada de manera segura.', 'info');
                }}
                className="w-full py-2.5 bg-red-50 hover:bg-red-100 border border-red-200/55 rounded-xl text-red-700 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Lock className="w-3.5 h-3.5" /> Cerrar Sesión Segura
              </button>
            </>
          )}

          {activeRole === 'admin' && (
            <>
              {/* BRAND ADVERT CONSOLE */}
              <div className="p-4 bg-practika text-white rounded-2xl relative overflow-hidden">
                <p className="text-[11px] font-bold tracking-widest text-teal uppercase mb-1">
                  SGC Chef Álvaro Estructura
                </p>
                <h4 className="text-md font-extrabold">ParqueSoft Meta Allied</h4>
                <p className="text-[12px] text-slate-300 mt-1 leading-relaxed">
                  Sistema de Gestión de Calidad basado en trazabilidad de lote por peso y calibre de aire restrenado.
                </p>
              </div>

              {/* METRICS PRESETS */}
              <div>
                <h4 className="text-xs font-bold text-practika uppercase tracking-wider mb-3">
                  Indicadores Clave
                </h4>
                {metrics ? (
                  <div className="space-y-3">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[12px] font-bold text-slate-500 uppercase">Facturación Mensual</p>
                      <div className="text-lg font-black text-practika mt-0.5">
                        $ {metrics.totalRevenueMonthly.toLocaleString()} COP
                      </div>
                      <span className="text-[12px] text-orange-600 font-semibold">↑ 14.5% vs Mes Ant.</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[12px] font-bold text-slate-500 uppercase">Suscripciones Activas</p>
                      <div className="text-lg font-black text-practika mt-0.5">
                        {metrics.activeSubscriptionsCount} Hogares
                      </div>
                      <span className="text-[12px] text-teal font-semibold">Retención: {metrics.customerRetentionRate}%</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[12px] font-bold text-slate-500 uppercase">CAC Promedio (Costo Adq)</p>
                      <div className="text-lg font-black text-practika mt-0.5">
                        $ {metrics.averageCAC.toLocaleString()} COP
                      </div>
                      <span className="text-[12px] text-slate-400">Objetivo: Menor a $50K</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Cargando métricas transaccionales...</p>
                )}
              </div>

              <button
                onClick={() => {
                  setIsAdminLogged(false);
                  localStorage.removeItem('isAdminLogged');
                  setActiveRole('cliente');
                  showNotification('Sesión de Caja Central cerrada de manera segura.', 'info');
                }}
                className="mt-4 w-full py-2.5 bg-red-50 hover:bg-red-100 border border-red-200/55 rounded-xl text-red-700 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Lock className="w-3.5 h-3.5" /> Cerrar Sesión Segura
              </button>
            </>
          )}

          {/* ACCESOS PARA PERSONAL AUTORIZADO (EXC. ADMIN CUANDO YA ESTÁ LOGUEADO) */}
          {activeRole === 'cliente' && (
            <div id="authorized-personnel-panel" className="bg-slate-50 border border-slate-200 p-4.5 rounded-[1.8rem] flex flex-col gap-2.5 shadow-none mt-2">
              <h5 className="text-[12px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                🔒 Personal Autorizado
              </h5>
              <p className="text-[12px] text-slate-500 leading-normal mb-1">
                Ingresa aquí si eres un operador de planta o personal de operaciones.
              </p>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => {
                    setActiveRole('practiker');
                    showNotification('Iniciando estación de Operario de Planta...', 'info');
                  }}
                  className="w-full bg-[#14b8a6]/10 hover:bg-[#14b8a6]/20 text-[#0d9488] text-[12px] font-black py-2 rounded-xl transition duration-150 flex items-center justify-center gap-1.5 uppercase tracking-wide border border-[#14b8a6]/15 cursor-pointer"
                >
                  <ChefHat className="w-3.5 h-3.5" /> Estación Operario
                </button>
                <button
                  onClick={() => {
                    setActiveRole('admin');
                    showNotification('Iniciando portal de Caja Central / SGC...', 'info');
                  }}
                  className="w-full bg-orange-500/10 hover:bg-orange-500/20 text-orange-700 text-[12px] font-black py-2 rounded-xl transition duration-150 flex items-center justify-center gap-1.5 uppercase tracking-wide border border-orange-500/15 cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5" /> Caja Central / SGC
                </button>
              </div>
            </div>
          )}

          {/* SHARED MINI ASSISTANT FLOATING CARD FOR ASSISTANCE */}
          {activeRole !== 'admin' && (
            <div className="mt-auto bg-[#fff7ed] p-5 rounded-3xl border border-orange-500/15 flex flex-col gap-3 shadow-none">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-practika rounded-full flex items-center justify-center text-white text-md font-bold shadow-sm">
                  👨‍🍳
                </div>
                <div>
                  <h5 className="text-xs font-black text-practika leading-tight">Asistente del Chef Álvaro</h5>
                  <p className="text-[11px] text-orange-700 font-bold uppercase tracking-widest mt-0.5">Powered by Gemini AI</p>
                </div>
              </div>
              <p className="text-[13px] text-practika/80 leading-normal">
                ¿Tienes dudas con el choque térmico o la hermeticidad al vacío en tu cocina?
              </p>
              <button
                onClick={() => setIsAssistantOpen(true)}
                className="w-full bg-practika hover:bg-orange-600 text-white text-[12px] font-black py-2.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-orange-500/10 flex items-center justify-center gap-1 uppercase tracking-widest"
              >
                <Sparkles className="w-3.5 h-3.5 text-orange-350" /> Preguntar al Chef AI
              </button>
            </div>
          )}
        </aside>

        {/* WORKSPACE AREA AREA */}
        <section id="app-workspace" className="flex-1 p-6 md:p-8 bg-[#faf7f5] overflow-y-auto flex flex-col gap-6 relative">
          
          {/* CLIENT VIEW FLOW */}
          {activeRole === 'cliente' && (
            <div className="flex-1 flex flex-col gap-6 animate-fade-in">
              
              {/* HERO BANNER SECTION */}
              <div className="relative rounded-[2.5rem] bg-gradient-to-r from-practika to-teal p-6 md:p-8 text-white flex flex-col justify-center shadow-lg min-h-48 overflow-hidden">
                <div className="absolute right-0 bottom-[-20px] text-[180px] font-black opacity-10 leading-none select-none pointer-events-none">
                  SOUS
                </div>
                <div className="max-w-xl relative z-10">
                  <span className="bg-vibrant/90 text-[12px] tracking-widest text-white px-2.5 py-1 rounded-full font-black uppercase inline-block mb-3">
                    Estándares de Economía Colaborativa
                  </span>
                  <h2 className="text-3xl md:text-4xl font-extrabold leading-tight tracking-tight mb-2">
                    Ahorra Tiempo y Cero Mermas al Cocinar
                  </h2>
                  <p className="text-slate-100 text-xs md:text-sm leading-relaxed mb-4">
                    PRACTIKA te entrega bases aromáticas, condimentos, vegetales asados y proteínas porcionadas y marinadas. Todo cocido o empacado al vacío por chefs de tu zona para resolver tu mes culinario.
                  </p>
                  
                  {/* QUICK STATS */}
                  <div className="flex items-center gap-6 mt-4">
                    <div className="text-center bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-sm border border-white/10">
                      <span className="block text-xl font-bold">100%</span>
                      <span className="text-[11px] text-orange-200 uppercase font-bold tracking-wider">Inocuidad HACCP</span>
                    </div>
                    <div className="text-center bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-sm border border-white/10">
                      <span className="block text-xl font-bold">3 Días</span>
                      <span className="text-[11px] text-orange-200 uppercase font-bold tracking-wider">De Entrega Máx.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTIONS LAYOUT */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* PRODUCTS LIST GRID (COL-SPAN 2) */}
                <div className="xl:col-span-2 flex flex-col gap-5">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/50 shadow-sm">
                    <div>
                      <h3 className="text-xl font-extrabold text-practika tracking-tight">
                        Catálogo de Alistamiento
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Selecciona kits específicos para añadir a tu canasta de entrega programada.
                      </p>
                    </div>
                    
                    {/* CATEGORY SWITCHES */}
                    <div className="flex flex-wrap gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                      {['Todos', 'Bases', 'Salsas', 'Vegetales', 'Proteínas'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setActiveCategory(cat)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                            activeCategory === cat 
                              ? 'bg-practika text-white shadow-sm' 
                              : 'text-slate-600 hover:text-orange-950 hover:bg-orange-50/50'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* PRODUCTS GRID */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((p) => {
                        // Emoji assignments based on categories
                        let emoji = '🍗';
                        if (p.category === 'Bases') emoji = '🧄';
                        else if (p.category === 'Salsas') emoji = '🧉';
                        else if (p.category === 'Vegetales') emoji = '🥗';

                        const quantityInCart = cart.find(c => c.product.id === p.id)?.q || 0;

                        return (
                          <div 
                            key={p.id} 
                            className="group bg-white rounded-3xl p-6 border border-slate-200/50 hover:border-orange-500/35 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden"
                          >
                            <div>
                              <div className="h-28 bg-orange-50/40 rounded-2xl mb-4 relative overflow-hidden flex items-center justify-center border border-orange-500/10">
                                <span className="text-4xl filter drop-shadow group-hover:scale-110 transition-transform duration-300 select-none">{emoji}</span>
                                <div className="absolute top-2 right-2 bg-orange-600/10 text-orange-850 backdrop-blur-sm px-2 py-0.5 rounded-lg text-[11px] font-extrabold uppercase tracking-widest">
                                  {p.category}
                                </div>
                                <div className="absolute bottom-2 left-2 bg-practika/90 text-white px-2 py-0.5 rounded-lg text-[11px] font-bold shadow-sm">
                                  {p.weightGrams}g / {p.unit}
                                </div>
                              </div>
                              <h4 className="font-extrabold text-practika text-md leading-tight group-hover:text-orange-600 transition-colors">
                                {p.name}
                              </h4>
                              <p className="text-xs text-slate-500 mt-1.5 mb-4 line-clamp-2 leading-relaxed">
                                {p.description}
                              </p>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex justify-between items-center mt-auto">
                              <div>
                                <span className="text-[12px] text-slate-400 block leading-none uppercase font-bold tracking-wider">Precio</span>
                                <span className="font-black text-lg text-practika">$ {p.price.toLocaleString()} COP</span>
                              </div>
                              
                              {quantityInCart > 0 ? (
                                <div className="flex items-center gap-2 bg-orange-600 p-1 rounded-full text-white shadow-sm">
                                  <button 
                                    onClick={() => updateCartQuantity(p.id, -1)}
                                    className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/40 font-bold transition"
                                  >
                                    <Minus className="w-3" />
                                  </button>
                                  <span className="text-xs font-bold px-1.5 min-w-[12px] text-center">{quantityInCart}</span>
                                  <button 
                                    onClick={() => updateCartQuantity(p.id, 1)}
                                    className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/40 font-bold transition"
                                  >
                                    <Plus className="w-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleAddToCard(p)}
                                  className="bg-practika hover:bg-orange-600 hover:shadow-md text-white px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1 shrink-0"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Agregar
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-slate-400 col-span-2 py-10 text-center">Cargando productos de alistamiento culinario...</p>
                    )}
                  </div>
                </div>

                {/* THE SUBSCRIPTION PLANS & CHECKOUT (COL-SPAN 1) */}
                <div className="flex flex-col gap-6">
                  
                  {/* SELECT PLAN PREFERENCE */}
                  <div className="p-5 bg-slate-50 rounded-3xl border border-slate-200">
                    <h3 className="text-sm font-black text-practika uppercase tracking-wider mb-3">
                      Selecciona un Plan Mensual
                    </h3>
                    <div className="space-y-2">
                      {subscriptions.map((sub) => (
                        <div 
                          key={sub.id} 
                          onClick={() => {
                            setActiveSuscId(sub.id);
                            showNotification(`Has seleccionado el ${sub.name}. Tu catálogo ya está optimizado.`, 'info');
                          }}
                          className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                            activeSuscId === sub.id 
                              ? 'border-vibrant bg-white shadow-sm' 
                              : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                          }`}
                        >
                          <div>
                            <p className="text-xs font-extrabold text-practika">{sub.name}</p>
                            <span className="text-[12px] text-slate-500 font-medium">Ciclo: {sub.deliveryFrequency}</span>
                          </div>
                          <span className="text-xs font-black text-vibrant">
                            $ {Math.round(sub.priceMonthly / 1000)}k <span className="text-[11px] text-slate-400 font-normal">/mes</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SHOPPING CART / CURRENT PROGRAM */}
                  <div className="p-5 bg-indigo-50/40 rounded-3xl border border-dashed border-indigo-200/80 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-black text-practika uppercase tracking-wider flex items-center gap-1">
                          <ShoppingBag className="w-4 h-4 text-vibrant" /> Tu Canasta de Alistamiento
                        </h4>
                        <span className="bg-indigo-100 text-indigo-700 text-[12px] px-2 py-0.5 rounded-full font-bold">
                          {cart.reduce((s, c) => s + c.q, 0)} items
                        </span>
                      </div>

                      {cart.length > 0 ? (
                        <div className="space-y-2.5 max-h-48 overflow-y-auto mb-4 pr-1">
                          {cart.map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-xs p-2 bg-white rounded-lg border border-slate-100">
                              <div className="truncate">
                                <p className="font-extrabold text-slate-800 truncate">{item.product.name}</p>
                                <p className="text-[12px] text-slate-400">{item.product.weightGrams}g x {item.q} packs</p>
                              </div>
                              <span className="font-bold text-slate-700 shrink-0 select-none ml-2">
                                $ {(item.product.price * item.q).toLocaleString()} COP
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center bg-white/50 rounded-xl mb-4 border border-dashed border-slate-200">
                          <CartIcon className="w-8 h-8 text-slate-300 mb-2" />
                          <p className="text-xs font-medium text-slate-500">No has seleccionado ítems individuales.</p>
                          <p className="text-[12px] text-slate-400 px-4 mt-1">
                            Añade bases y proteínas del catálogo para programar tu entrega.
                          </p>
                        </div>
                      )}

                      {/* DELIVERY WINDOW CONFIG */}
                      <div className="pt-3 border-t border-indigo-100 space-y-2">
                        <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider">
                          Dirección de Entrega
                        </label>
                        <input 
                          type="text" 
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-vibrant font-medium text-slate-700"
                        />

                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider">
                              Fecha Entrega
                            </label>
                            <input 
                              type="date" 
                              value={deliveryDate}
                              onChange={(e) => setDeliveryDate(e.target.value)}
                              className="w-full bg-white border border-slate-200 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-vibrant font-medium text-slate-700"
                            />
                          </div>
                          <div>
                            <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider">
                              Ventana Horaria
                            </label>
                            <select 
                              value={deliveryWindow}
                              onChange={(e) => setDeliveryWindow(e.target.value)}
                              className="w-full bg-white border border-slate-200 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-vibrant font-medium text-slate-700 cursor-pointer"
                            >
                              <option value="06:00 - 08:00">🌅 Temprano am (06-08)</option>
                              <option value="08:00 - 10:00">☀️ Mañana Temprano (08-10)</option>
                              <option value="10:00 - 12:00">🌤️ Media Mañana (10-12)</option>
                              <option value="12:00 - 14:00">🕛 Medio Día/Almuerzo (12-14)</option>
                              <option value="14:00 - 16:00">🌇 Tarde Temprano (14-16)</option>
                              <option value="16:00 - 18:00">🌆 Tarde/Cierre (16-18)</option>
                              <option value="18:00 - 20:00">🌃 Noche/Cena (18-20)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200">
                      <div className="flex justify-between items-baseline mb-4">
                        <span className="text-xs text-slate-500 font-bold uppercase">Total Alistamiento:</span>
                        <span className="text-xl font-black text-practika">$ {totalCartPrice.toLocaleString()} COP</span>
                      </div>

                      <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0}
                        className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 transition ${
                          cart.length > 0 
                            ? 'bg-vibrant hover:bg-vibrant/90 text-white shadow-vibrant cursor-pointer' 
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        Agendar y Alistar al Vacío <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* OPERATOR PRACTIKER VIEW FLOW */}
          {activeRole === 'practiker' && (
            <div className="flex-1 flex flex-col gap-6 animate-fade-in">
              
              {/* STATUS LOGISTICS OVERVIEW */}
              <div className="p-5 bg-gradient-to-r from-practika to-teal text-white rounded-[2.5rem] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black">Centro de Operaciones Colaborativas</h3>
                  <p className="text-xs text-[#C6EBEC] mt-0.5 leading-relaxed">
                    Preparación gamificada con protocolos HACCP. Alista los ingredientes usando las recetas del Chef Álvaro.
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="bg-white/10 px-4 py-2 rounded-xl text-center">
                    <span className="block text-lg font-black">{orders.filter(o => o.status === 'pendiente').length}</span>
                    <span className="text-[11px] text-[#A6E1E4] uppercase">Pendientes</span>
                  </div>
                  <div className="bg-white/10 px-4 py-2 rounded-xl text-center">
                    <span className="block text-lg font-black">{orders.filter(o => o.status === 'preparando' && o.operatorId === selectedOperatorId).length}</span>
                    <span className="text-[11px] text-[#A6E1E4] uppercase">En Cocina</span>
                  </div>
                </div>
              </div>

              {/* COLUMNS SPLIT */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* CLAIM ASSIGNMENTS & ORDERS STREAM (COL-SPAN 1) */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-lg font-extrabold text-practika flex items-center gap-1.5">
                    <Layers className="w-5 h-5 text-vibrant" /> Cola de Logística
                  </h3>

                  {/* ORDER LOGS SCOPE */}
                  <div className="space-y-3">
                    {orders.filter(o => o.status === 'pendiente').length > 0 ? (
                      <div>
                        <p className="text-[12px] font-black text-slate-400 uppercase tracking-wider mb-2">Pedidos Disponibles para Tomar</p>
                        {orders.filter(o => o.status === 'pendiente').map(order => (
                          <div key={order.id} className="p-4 bg-orange-50/50 border border-orange-200/80 rounded-2xl flex flex-col justify-between gap-3 shadow-sm hover:bg-orange-50 transition">
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-extrabold text-xs text-practika">{order.id}</span>
                                <span className="bg-amber-100 text-amber-800 text-[11px] px-2 py-0.5 rounded-full font-bold">Pendiente</span>
                              </div>
                              <p className="text-xs font-bold text-slate-700">{order.clientName}</p>
                              <p className="text-[13px] text-slate-500 line-clamp-1">{order.clientAddress}</p>
                              
                              <div className="mt-2 space-y-1">
                                {order.items.map((it, idx) => (
                                  <span key={idx} className="inline-block bg-white text-slate-600 text-[12px] px-1.5 py-0.5 rounded border border-slate-200/60 mr-1 mt-1">
                                    {it.quantity}x {it.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <button
                              onClick={() => handleClaimOrder(order.id)}
                              className="w-full bg-vibrant hover:bg-vibrant/90 text-white text-[12px] font-extrabold py-2 rounded-xl transition uppercase"
                            >
                              Tomar Pedido y Preparar
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 my-4 text-center">No hay pedidos pendientes libres. Todo tomado.</p>
                    )}

                    {/* ASSIGNED ACTIVE WORKFLOW */}
                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-wider mt-4 mb-2">Tus Tareas Asignadas</p>
                    {orders.filter(o => o.operatorId === selectedOperatorId && o.status !== 'entregado').length > 0 ? (
                      orders.filter(o => o.operatorId === selectedOperatorId && o.status !== 'entregado').map(order => (
                        <div 
                          key={order.id} 
                          className={`p-4 rounded-3xl border transition-all ${
                            activePreparingOrderId === order.id 
                              ? 'border-teal bg-teal/5 shadow' 
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-extrabold text-xs text-practika">{order.id}</span>
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              order.status === 'preparando' ? 'bg-teal text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {order.status === 'asignado' ? 'Asignado' : order.status === 'empaque_listo' ? 'Empacado OK' : 'Preparando'}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-700">{order.clientName}</p>
                          <p className="text-[12px] text-slate-400 mt-0.5 font-medium">Ventana: {order.scheduledDeliveryDate} ({order.deliveryWindow})</p>
                          
                          {/* LIST ITEMS */}
                          <div className="my-2 border-t border-b border-dashed border-slate-200 py-2 space-y-1">
                            {order.items.map((it, idx) => (
                              <div key={idx} className="text-xs font-semibold text-slate-600 flex justify-between">
                                <span>• {it.name}</span>
                                <span>{it.quantity} x {it.weightGrams}g</span>
                              </div>
                            ))}
                          </div>

                          {order.status === 'asignado' && (
                            <button
                              onClick={() => handleStartPreparation(order.id)}
                              className="w-full bg-practika text-white text-[12px] font-extrabold py-2 rounded-xl transition uppercase tracking-widest mt-2"
                            >
                              Iniciar Cocina Guiada
                            </button>
                          )}

                          {order.status === 'preparando' && activePreparingOrderId !== order.id && (
                            <button
                              onClick={() => {
                                handleStartPreparation(order.id);
                              }}
                              className="w-full border border-teal text-teal text-[12px] font-extrabold py-2 rounded-xl transition uppercase mt-2 hover:bg-teal/5"
                            >
                              Ver Receta Activa
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-6 border border-dashed border-slate-200 rounded-2xl">
                        No tienes tareas en preparación en este momento. Toma un pedido libre arriba.
                      </p>
                    )}
                  </div>
                </div>

                {/* ACTIVE GUIDED RECIPE CHECKLIST (COL-SPAN 2) */}
                <div className="xl:col-span-2 flex flex-col gap-4">
                  <h3 className="text-lg font-extrabold text-practika flex items-center gap-1.5">
                    <ChefHat className="w-5 h-5 text-teal" /> Flujo de Trabajo Gamificado & Receta Co-Op
                  </h3>

                  {selectedRecipe ? (
                    <div className="bg-slate-50 rounded-[2.5rem] p-6 border-2 border-teal shadow-sm flex flex-col justify-between">
                      <div>
                        {/* RECIPE HEADER */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 mb-4 gap-2">
                          <div>
                            <span className="text-[11px] font-black bg-teal/20 text-teal-800 px-2 py-0.5 rounded uppercase tracking-wider">
                              Fórmula Estándar # {selectedRecipe.id}
                            </span>
                            <h4 className="text-xl font-bold text-practika mt-1">
                              {selectedRecipe.productName}
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Creador: {selectedRecipe.chefName} • lote sugerido: {selectedRecipe.standardBatchSize}
                            </p>
                          </div>
                          <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-center shrink-0">
                            <span className="block text-[11px] font-bold text-slate-400 uppercase">Tiempo Culinario</span>
                            <span className="text-md font-extrabold text-practika">{selectedRecipe.prepTimeMinutes} mins</span>
                          </div>
                        </div>

                        {/* INGREDIENTS CHECKLIST GRID */}
                        <div className="mb-4">
                          <p className="text-[12px] font-black text-slate-500 uppercase tracking-widest mb-2">Ingredientes de Precisión requeridos:</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {selectedRecipe.ingredients.map((ing, i) => (
                              <div key={i} className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs flex justify-between">
                                <span className="text-slate-600 truncate">{ing.name}</span>
                                <span className="font-extrabold text-practika">{ing.quantity} {ing.unit}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* WORKFLOW STEPS PROGRESS */}
                        <div className="mb-6">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Ejecución del Lote ({currentStepIndex + 1} de {selectedRecipe.steps.length})</span>
                            <span className="text-xs font-extrabold text-teal">
                              {Math.round(((currentStepIndex) / selectedRecipe.steps.length) * 100)}% Completado
                            </span>
                          </div>
                          
                          {/* PROGRESS LINE */}
                          <div className="flex gap-1.5 mb-4">
                            {selectedRecipe.steps.map((_, idx) => (
                              <div 
                                key={idx} 
                                onClick={() => setCurrentStepIndex(idx)}
                                className={`h-1.5 rounded-full flex-1 transition-all cursor-pointer ${
                                  idx <= currentStepIndex ? 'bg-teal text-white' : 'bg-slate-200'
                                }`}
                              ></div>
                            ))}
                          </div>

                          {/* ACTION STEP BOX */}
                          <div className="p-4 bg-white rounded-2xl border-2 border-teal/10 relative overflow-hidden">
                            <div className="flex justify-between items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-teal text-white flex items-center justify-center text-xs font-extrabold shrink-0">
                                {selectedRecipe.steps[currentStepIndex].stepNumber}
                              </div>
                              <div className="flex-1">
                                {selectedRecipe.steps[currentStepIndex].isCriticalQualityPoint && (
                                  <span className="bg-red-50 text-red-600 text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded inline-block mb-1 flex-row items-center gap-1">
                                    🚨 Punto Crítico de Control Alimentario (Inocuidad SGC)
                                  </span>
                                )}
                                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                  {selectedRecipe.steps[currentStepIndex].instruction}
                                </p>
                              </div>
                              <div className="text-right shrink-0 bg-slate-50 px-2 py-1 rounded text-xs font-bold text-slate-500 font-mono">
                                {selectedRecipe.steps[currentStepIndex].durationMinutes}m
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 flex justify-between gap-2">
                            <button
                              disabled={currentStepIndex === 0}
                              onClick={() => setCurrentStepIndex(p => Math.max(0, p - 1))}
                              className="px-3 py-1.5 bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg text-xs font-bold disabled:opacity-40"
                            >
                              Anterior
                            </button>
                            <button
                              disabled={currentStepIndex === selectedRecipe.steps.length - 1}
                              onClick={() => {
                                // Mark item checked
                                const nextChecks = [...recipeChecklist];
                                nextChecks[currentStepIndex] = true;
                                setRecipeChecklist(nextChecks);
                                setCurrentStepIndex(p => Math.min(selectedRecipe.steps.length - 1, p + 1));
                              }}
                              className="px-4 py-1.5 bg-teal text-white hover:bg-teal/90 rounded-lg text-xs font-bold disabled:opacity-40 flex items-center gap-1"
                            >
                              Siguiente Paso <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* TELEMETRY HACCP RECORD SIGNATURE FORM */}
                        <div className="p-5 bg-teal/10 rounded-2xl border border-teal/20 space-y-4">
                          <p className="text-[12px] font-black text-practika uppercase tracking-wider flex items-center gap-1">
                            <Activity className="w-4 h-4 text-vibrant" /> Registro Teletérmico de Hermeticidad al Vacío
                          </p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                <Weight className="w-3 h-3 text-slate-400" /> Peso Neto (g)
                              </label>
                              <input 
                                type="number" 
                                value={telemetryWeight}
                                onChange={(e) => setTelemetryWeight(e.target.value)}
                                className="w-full bg-white border border-slate-300 text-xs px-2 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal font-extrabold text-slate-700"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                <Gauge className="w-3 h-3 text-slate-400" /> Presión de Aire (%)
                              </label>
                              <input 
                                type="text" 
                                value={telemetryPressure}
                                onChange={(e) => setTelemetryPressure(e.target.value)}
                                className={`w-full bg-white border text-xs px-2 py-1.5 rounded-lg focus:outline-none focus:ring-1 font-extrabold text-slate-700 transition-all ${
                                  haccpLimits?.isPressureOk 
                                    ? 'border-slate-300 focus:ring-teal' 
                                    : 'border-red-500 ring-2 ring-red-500/20 focus:ring-red-500 focus:border-red-500'
                                }`}
                              />
                              {haccpLimits && (
                                <div className="mt-1.5 flex flex-col gap-0.5 text-[11px]">
                                  <span className="text-slate-400 font-semibold">Mínimo seguro: {haccpLimits.minPressure.toFixed(1)}%</span>
                                  <span className={`font-black uppercase tracking-wider ${haccpLimits.isPressureOk ? 'text-orange-600' : 'text-red-600 animate-pulse'}`}>
                                    {haccpLimits.isPressureOk ? '🟢 Conforme' : '🚨 Fuera de Rango'}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                <Thermometer className="w-3 h-3 text-slate-400" /> Calor Barra (°C)
                              </label>
                              <input 
                                type="number" 
                                value={telemetryTemp}
                                onChange={(e) => setTelemetryTemp(e.target.value)}
                                className={`w-full bg-white border text-xs px-2 py-1.5 rounded-lg focus:outline-none focus:ring-1 font-extrabold text-slate-700 transition-all ${
                                  haccpLimits?.isTempOk 
                                    ? 'border-slate-300 focus:ring-teal' 
                                    : 'border-red-500 ring-2 ring-red-500/20 focus:ring-red-500 focus:border-red-500'
                                }`}
                              />
                              {haccpLimits && (
                                <div className="mt-1.5 flex flex-col gap-0.5 text-[11px]">
                                  <span className="text-slate-400 font-semibold">Tolerancia: {haccpLimits.minTemp}°C - {haccpLimits.maxTemp}°C</span>
                                  <span className={`font-black uppercase tracking-wider ${haccpLimits.isTempOk ? 'text-orange-600' : 'text-red-600 animate-pulse'}`}>
                                    {haccpLimits.isTempOk ? '🟢 Conforme' : '🚨 Fuera de Rango'}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" /> Soldadura (s)
                              </label>
                              <input 
                                type="text" 
                                value={telemetryTime}
                                onChange={(e) => setTelemetryTime(e.target.value)}
                                className="w-full bg-white border border-slate-300 text-xs px-2 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal font-extrabold text-slate-700"
                              />
                            </div>
                          </div>

                          <div className="bg-white/60 p-2.5 rounded-xl border border-slate-200 text-[12px] text-slate-500 leading-tight">
                            <span className="font-extrabold text-slate-700">Especificación de empaque para esta categoría:</span> {selectedRecipe.vacuumSpecification.packagingType}. Sellar a vacío absoluto para retener jugos culinarios.
                          </div>
                        </div>

                      </div>

                      {/* HACCP WARNING BANNER */}
                      {haccpLimits && !haccpLimits.isValid && (
                        <div className="mt-4 p-4.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 animate-fade-in">
                          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5 animate-bounce" />
                          <div className="text-xs text-red-800 leading-normal">
                            <p className="font-extrabold text-red-900 uppercase tracking-widest text-[11px]">
                              ⚠️ Bloqueo de Inocuidad HACCP Activo
                            </p>
                            <p className="font-medium mt-1">
                              Los valores ingresados no garantizan un acoplamiento hermético estéril. Corrija los parámetros en la selladora al vacío e intente de nuevo.
                            </p>
                            <ul className="list-disc pl-4 mt-1.5 space-y-0.5 text-[13px] font-semibold text-red-700">
                              {!haccpLimits.isPressureOk && (
                                <li>
                                  Presión de aire: {haccpLimits.parsedPressure}% (Debe estar entre {haccpLimits.minPressure.toFixed(1)}% y 100% para evitar aire residual).
                                </li>
                              )}
                              {!haccpLimits.isTempOk && (
                                <li>
                                  Calor de barra: {haccpLimits.parsedTemp ? `${haccpLimits.parsedTemp}°C` : 'N/A'} (Debe estar en el rango de {haccpLimits.minTemp}°C a {haccpLimits.maxTemp}°C para asegurar una soldadura exitosa).
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>
                      )}

                      <div className="mt-6 pt-4 border-t border-slate-200">
                        <button
                          disabled={haccpLimits ? !haccpLimits.isValid : false}
                          onClick={handleCompletePackaging}
                          className={`w-full py-4 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition shadow-md flex items-center justify-center gap-2 ${
                            (haccpLimits && !haccpLimits.isValid)
                              ? 'bg-slate-300 cursor-not-allowed opacity-50 shadow-none text-slate-500'
                              : 'bg-teal hover:bg-teal-700'
                          }`}
                        >
                          <CheckCircle className="w-4 h-4" /> Registrar Certificación de Vacío e Inocuidad
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-20 text-center border-4 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-400">
                      <ChefHat className="w-16 h-16 text-slate-200 mb-3" />
                      <p className="text-sm font-bold">Sin Receta Activa</p>
                      <p className="text-xs text-slate-400 max-w-sm mt-1 px-4">
                        Inicia la cocina del lote en tu cola de logística a la izquierda para cargar las especificaciones térmicas y de aire del Chef Álvaro.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* ADMIN VIEW FLOW */}
          {activeRole === 'admin' && (
            <div className="flex-1 flex flex-col gap-6 animate-fade-in">
              
              {/* ADMIN GRID HIGHLIGHTS */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* SYSTEM ORDERS STREAM MONITORING (COL-SPAN 2) */}
                <div className="xl:col-span-2 flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
                    <div>
                      <h3 className="text-2xl font-extrabold text-practika tracking-tight">
                        Flujo General de Pedidos
                      </h3>
                      <p className="text-xs text-slate-500">
                        Control y monitoreo del mapa territorial de alistamiento colaborativo (Villavicencio).
                      </p>
                    </div>
                    <button 
                      onClick={loadAllData}
                      className="px-3.5 py-1.5 bg-slate-100 font-extrabold text-xs text-slate-600 rounded-lg hover:bg-slate-200 transition"
                    >
                      Refrescar Live
                    </button>
                  </div>

                  {/* RENDERING THE ADVANCED SEARCH & FILTER PANEL */}
                  <div className="bg-white border border-slate-200/60 p-6 rounded-3xl flex flex-col md:flex-row gap-4 items-end shadow-sm">
                    {/* Por Cliente */}
                    <div className="w-full md:flex-1 font-sans animate-fade-in">
                      <label className="block text-[12px] font-black text-practika uppercase tracking-wider mb-2">
                        🔎 Buscar Cliente / Domicilio
                      </label>
                      <input
                        type="text"
                        value={adminSearchQuery}
                        onChange={(e) => setAdminSearchQuery(e.target.value)}
                        placeholder="Escribe el nombre o código de pedido..."
                        className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 text-xs px-3.5 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-700 font-sans transition-all"
                      />
                    </div>

                    {/* Por Estado */}
                    <div className="w-full md:w-56 font-sans">
                      <label className="block text-[12px] font-black text-practika uppercase tracking-wider mb-2">
                        ⚙️ Estado de Logística
                      </label>
                      <select
                        value={adminStatusFilter}
                        onChange={(e) => setAdminStatusFilter(e.target.value)}
                        className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 text-xs px-3.5 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-extrabold text-slate-700 transition-all cursor-pointer"
                      >
                        <option value="Todos">🟢 Mostrar Todos</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="asignado">Asignado</option>
                        <option value="preparando">Preparando</option>
                        <option value="empaque_listo">Empaque Listo</option>
                        <option value="entregado">Entregado</option>
                      </select>
                    </div>

                    {/* Por Fecha de Entrega */}
                    <div className="w-full md:w-48 font-sans">
                      <label className="block text-[12px] font-black text-practika uppercase tracking-wider mb-2">
                        📅 Fecha de Entrega
                      </label>
                      <input
                        type="date"
                        value={adminDateFilter}
                        onChange={(e) => setAdminDateFilter(e.target.value)}
                        className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold text-slate-700 transition-all cursor-pointer"
                      />
                    </div>

                    {/* Limpiar Filtros */}
                    {(adminSearchQuery || adminDateFilter || adminStatusFilter !== 'Todos') && (
                      <button
                        onClick={() => {
                          setAdminSearchQuery('');
                          setAdminStatusFilter('Todos');
                          setAdminDateFilter('');
                        }}
                        className="w-full md:w-auto px-5 py-3 bg-orange-600 hover:bg-practika text-white text-xs font-black rounded-xl transition duration-200 shrink-0 uppercase tracking-widest shadow-sm hover:shadow"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>

                  {/* MASTER LIST OF ORDERS */}
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[12px]">
                            <th className="py-3 px-2">ID Pedido</th>
                            <th className="py-3 px-2">Cliente / Domicilio</th>
                            <th className="py-3 px-2">Detalle Insumo</th>
                            <th className="py-3 px-2">Asignatario</th>
                            <th className="py-3 px-3">Estado Logística</th>
                            <th className="py-3 px-2 text-right">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium font-sans">
                          {filteredAdminOrders.map((o) => {
                            let badgeClass = 'bg-slate-100 text-slate-600';
                            if (o.status === 'pendiente') badgeClass = 'bg-orange-100 text-orange-800';
                            else if (o.status === 'preparando') badgeClass = 'bg-teal/20 text-teal-800';
                            else if (o.status === 'empaque_listo') badgeClass = 'bg-amber-100 text-amber-900';
                            else if (o.status === 'entregado') badgeClass = 'bg-blue-100 text-blue-800';

                            return (
                              <tr key={o.id} className="hover:bg-slate-100/50 transition duration-150">
                                <td className="py-3.5 px-2 font-bold text-practika">{o.id}</td>
                                <td className="py-3.5 px-2">
                                  <span className="font-extrabold text-slate-800 block">{o.clientName}</span>
                                  <span className="text-[12px] text-slate-500 block truncate max-w-[150px]">{o.clientAddress}</span>
                                </td>
                                <td className="py-3.5 px-2">
                                  <div className="space-x-1">
                                    {o.items.map((it, idx) => (
                                      <span key={idx} className="inline-block bg-white border border-slate-200 text-[12px] px-1 rounded text-slate-600">
                                        {it.quantity}x {it.name.split(' ')[0]}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="py-3.5 px-2 font-bold text-teal">
                                  {o.operatorName ? JSON.stringify(o.operatorName).replace(/"/g, '') : '-'}
                                </td>
                                <td className="py-3.5 px-3">
                                  <span className={`text-[12px] px-2.5 py-0.5 rounded-full font-bold uppercase ${badgeClass}`}>
                                    {o.status}
                                  </span>
                                </td>
                                <td className="py-3.5 px-2 text-right">
                                  {o.status === 'empaque_listo' && (
                                    <button
                                      onClick={() => handleDeliver(o.id)}
                                      className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-[11px] uppercase px-2.5 py-1 rounded shadow-sm transition"
                                    >
                                      Despachar
                                    </button>
                                  )}
                                  {o.status === 'entregado' && (
                                    <span className="text-[12px] text-slate-400 font-extrabold flex items-center justify-end gap-1">
                                      <Check className="w-3.5 h-3.5 text-orange-500" /> Entregado
                                    </span>
                                  )}
                                  {o.status === 'pendiente' && (
                                    <span className="text-[12px] text-amber-500 font-bold">Esperando Operador</span>
                                  )}
                                  {o.status === 'preparando' && (
                                    <span className="text-[12px] text-teal font-semibold">En Campana Vacío</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                          {filteredAdminOrders.length === 0 && (
                            <tr>
                              <td colSpan={6} className="py-12 text-center text-slate-500">
                                <div className="flex flex-col items-center justify-center gap-2">
                                  <span className="text-3xl text-slate-400">🔍</span>
                                  <p className="font-extrabold text-slate-700">Sin resultados de búsqueda</p>
                                  <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                                    No se encontraron pedidos de alistamiento que coincidan con tus filtros aplicados. Borra filtros para restablecer.
                                  </p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* CERTIFIED OPERATORS TRACKING */}
                  <div className="mt-4">
                    <h4 className="text-xs font-bold text-practika uppercase tracking-wider mb-2">Estado de la red de micro-centros</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {practikers.map((op) => (
                        <div key={op.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between gap-3 text-xs shadow-sm">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-extrabold text-practika">{op.name}</span>
                              <span className="bg-orange-100 text-orange-850 text-[11px] px-1.5 py-0.5 rounded uppercase font-bold">Certificado OK</span>
                            </div>
                            <span className="text-[12px] text-slate-500 font-semibold">{op.locationName}</span>
                          </div>
                          
                          <div className="flex justify-between text-[13px] border-t border-dashed border-slate-200/80 pt-2 text-slate-600 font-mono">
                            <span>Suministros: Normal {op.rawIngredientsStock.filter(s=>s.stockLevelPercent > 15).length} / {op.rawIngredientsStock.length}</span>
                            <span>Rating: <strong className="text-amber-500 font-sans">★ {op.rating}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* THE DEMAND FORECASTING ENGINE AI PANEL (COL-SPAN 1) */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-lg font-extrabold text-practika flex items-center gap-1.5">
                    <Sparkles className="w-5 h-5 text-vibrant" /> Inteligencia Zero Waste / Demanda
                  </h3>

                  <div className="p-6 bg-slate-50 border-2 border-vibrant rounded-[2.5rem] shadow-vibrant flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="bg-vibrant text-white text-[12px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                          Motor Cognitivo De Compra
                        </span>
                        <span className="text-[12px] font-bold text-[#FF6B35]">Chef AI</span>
                      </div>
                      
                      <h4 className="text-xl font-extrabold text-practika mb-2">
                        Predicción de Célula de Compra
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed mb-4">
                        Analiza las existencias actuales de los Practikers contra las de pedidos de hogares suscritos, para programar compras colectivas sin mermas ni desperdicio.
                      </p>

                      <button
                        onClick={handleRunDemandForecast}
                        disabled={isPredicting}
                        className="w-full bg-vibrant hover:bg-vibrant/90 text-white font-extrabold text-xs py-3.5 rounded-2xl transition shadow-md flex items-center justify-center gap-2 uppercase tracking-wide disabled:opacity-50"
                      >
                        {isPredicting ? (
                          <>
                            <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                            Calculando con Gemini 3.5...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-white" /> Predecir Demanda de Insumos
                          </>
                        )}
                      </button>

                      {/* STRUCTURAL AI RESPONSE RENDER */}
                      {demandPrediction && (
                        <div className="mt-5 space-y-4">
                          <div className="bg-white p-3 rounded-xl border border-slate-200">
                            <span className="block text-[11px] font-black text-slate-400 uppercase tracking-widest">Aprovisionamientos Previstos</span>
                            <div className="mt-2 space-y-1.5 text-xs">
                              {demandPrediction.rawMaterialsNeeded.map((item, i) => (
                                <div key={i} className="flex justify-between py-1 border-b border-slate-50">
                                  <span className="font-semibold text-slate-700 truncate max-w-[170px]">{item.ingredientName}</span>
                                  <span className="font-extrabold text-practika shrink-0 font-mono">
                                    {item.deficitKg > 0 ? (
                                      <span className="text-red-500">Falta {item.deficitKg} {item.unit}</span>
                                    ) : (
                                      <span className="text-orange-600">Cubierto ({item.currentInventoryKg} {item.unit})</span>
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* SYSTEM RECOMMENDATIONS AI REPORT */}
                          <div className="bg-white p-4 rounded-xl border border-dashed border-vibrant/40 max-h-56 overflow-y-auto pr-1">
                            <h5 className="text-[12px] font-bold text-vibrant uppercase tracking-wider mb-2 flex items-center gap-1">
                              📬 Recomendaciones de Optimización de Margen
                            </h5>
                            <div className="text-xs text-slate-600 leading-relaxed font-medium">
                              {renderSimpleMarkdown(demandPrediction.aiInsightsMarkdown)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {!demandPrediction && (
                      <div className="py-14 text-center text-slate-400 mt-6 bg-white/40 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center">
                        <TrendingUp className="w-10 h-10 text-slate-300 mb-2" />
                        <p className="text-xs font-bold">Motor Inactivo</p>
                        <span className="text-[12px] text-slate-400 mt-0.5 max-w-xs block px-4 leading-normal">
                          Detona el motor arriba para predecir gramos necesarios de ajo, carnes y empaques.
                        </span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

        </section>
          </>
        )}

      </div>

      {/* FOOTER AREA BAR */}
      <footer id="app-footer" className="h-16 bg-white border-t border-slate-200 px-6 md:px-10 flex items-center justify-between shrink-0 text-xs">
        <div className="flex gap-4 md:gap-12 text-xs font-bold text-slate-400 uppercase tracking-widest">
          <div className={`flex items-center gap-2 ${activeRole === 'cliente' ? 'text-vibrant' : ''}`}>
            <span className={`w-2 h-2 rounded-full ${activeRole === 'cliente' ? 'bg-vibrant' : 'bg-slate-300'}`}></span>
            Catálogo
          </div>
          <div className={`flex items-center gap-2 ${activeRole === 'practiker' ? 'text-teal' : ''}`}>
            <span className={`w-2 h-2 rounded-full ${activeRole === 'practiker' ? 'bg-teal' : 'bg-slate-300'}`}></span>
            Recetario IA
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-300"></span>
            Comunidad
          </div>
        </div>
        <div className="flex items-center gap-4 text-slate-400 font-semibold text-[12px] md:text-xs">
          <span>Desarrollado en alianza con</span>
          <div className="flex items-center gap-1 font-extrabold text-slate-600">
            <div className="w-4 h-4 bg-practika rounded-sm"></div> 
            PARQUESOFT META
            <button 
              onClick={() => setIsSecretAdminModalOpen(true)}
              className="ml-2 text-slate-300 hover:text-slate-500 transition-colors p-1"
              title="Panel de Control Administrativo"
            >
              <Shield className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </footer>

      {/* SECRET ADMINISTRATIVE CONFIGURATION & ACCOUNT CREATOR MODAL */}
      {isSecretAdminModalOpen && (
        <div id="secret-admin-settings-modal" className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-9 border border-slate-700 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] bg-white animate-fade-in text-slate-800">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-practika to-orange-600 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl shadow border border-white/15">
                  🛠️
                </div>
                <div>
                  <h3 className="text-lg font-black leading-tight">Panel Administrativo Secreto</h3>
                  <p className="text-[12px] text-orange-200 font-extrabold uppercase tracking-widest mt-0.5">Control de Roles y Generación de Credenciales</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsSecretAdminModalOpen(false);
                  setNewUsername('');
                  setNewPassword('');
                  setNewName('');
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Container */}
            <div className="p-6 md:p-8 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              
              {/* SECTION 1: WORKSPACE SELECTION TABS */}
              <div className="bg-orange-50/50 border border-orange-500/10 p-5 rounded-3xl">
                <h4 className="text-xs font-black text-orange-950 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  🚀 1. Activar Vista Operativa Especializada
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Selecciona la sección del sistema a la cual deseas acceder. El sistema te redirigirá a la pantalla de autenticación segura del rol elegido.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setActiveRole('practiker');
                      setIsSecretAdminModalOpen(false);
                      showNotification('Redirigido a la estación de Operario de Planta.', 'info');
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 group ${
                      activeRole === 'practiker'
                        ? 'bg-teal border-teal text-white'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <ChefHat className={`w-5 h-5 shrink-0 mt-0.5 ${activeRole === 'practiker' ? 'text-white' : 'text-teal group-hover:scale-110 transition-transform'}`} />
                    <div>
                      <p className="text-xs font-bold font-sans uppercase tracking-wider">Operador de Planta</p>
                      <p className={`text-[12px] mt-1 leading-normal ${activeRole === 'practiker' ? 'text-teal-100' : 'text-slate-500'}`}>
                        Mesa de cocina, loteo bajo norma HACCP y telemetría de hermeticidad.
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setActiveRole('admin');
                      setIsSecretAdminModalOpen(false);
                      showNotification('Redirigido al panel de Caja Central y SGC.', 'info');
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 group ${
                      activeRole === 'admin'
                        ? 'bg-practika border-practika text-white'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <Database className={`w-5 h-5 shrink-0 mt-0.5 ${activeRole === 'admin' ? 'text-white' : 'text-orange-600 group-hover:scale-110 transition-transform'}`} />
                    <div>
                      <p className="text-xs font-bold font-sans uppercase tracking-wider">Caja Central / SGC</p>
                      <p className={`text-[12px] mt-1 leading-normal ${activeRole === 'admin' ? 'text-orange-100' : 'text-slate-500'}`}>
                        Métricas en vivo, control de pedidos, predicción artificial e inventarios.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* SECTION 2: ACCOUNTS LIST AND GENERATION ENGINE */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-practika uppercase tracking-widest flex items-center gap-1.5 font-bold">
                      🔑 2. Generador de Usuarios & Contraseñas
                    </h4>
                    <p className="text-[13px] text-slate-500 mt-0.5">
                      Crea, examina o remueve las credenciales que otorgan acceso a los paneles. Se guardan localmente para este navegador (localStorage).
                    </p>
                  </div>
                </div>

                {/* Users Registry List Table */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-inner">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 border-b border-slate-200 text-slate-650 uppercase font-black text-[11px] tracking-wider">
                        <tr>
                          <th className="px-4 py-2.5">Funcionario</th>
                          <th className="px-4 py-2.5">Rol de Sistema</th>
                          <th className="px-4 py-2.5">Usuario Nick</th>
                          <th className="px-4 py-2.5">Contraseña clave</th>
                          <th className="px-4 py-2.5 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/80 font-semibold text-slate-700">
                        {users.map((usr) => (
                          <tr key={usr.username} className="hover:bg-slate-100/50 transition-all">
                            <td className="px-4 py-3 font-bold text-slate-900">{usr.name}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                                usr.role === 'admin' 
                                  ? 'bg-orange-100 text-orange-900 border border-orange-200' 
                                  : 'bg-teal-50 text-teal border border-teal-200'
                              }`}>
                                {usr.role === 'admin' ? 'Cajero / Admin' : 'Operario de Planta'}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-orange-950 font-bold bg-orange-50/25">@{usr.username}</td>
                            <td className="px-4 py-3 font-mono text-slate-600 font-extrabold">
                              {passwords[usr.username] || '---'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {/* Prevent deletion of the initial master administrative seeds to avoid locking out */}
                              {usr.username !== 'admin' && usr.username !== 'operador' ? (
                                <button
                                  onClick={() => deleteUser(usr.username)}
                                  className="text-red-500 hover:text-red-700 font-extrabold hover:underline"
                                >
                                  Eliminar
                                </button>
                              ) : (
                                <span className="text-[12px] text-slate-450 italic font-medium">Predeterminado</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Form to generate new users dynamically */}
                <div className="bg-slate-100/60 border border-slate-250 p-5 rounded-3xl space-y-4 shadow-sm">
                  <p className="text-[12px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                    ➕ Registrar Nuevo Personal Autorizado
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-black text-slate-450 uppercase tracking-wider mb-1">
                        Nombre Completo del Personal
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Edwin Silva o Maria Cajera"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-practika text-xs px-3 py-2.5 rounded-xl font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-slate-450 uppercase tracking-wider mb-1">
                        Rol / Permiso
                      </label>
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as 'practiker' | 'admin')}
                        className="w-full bg-white border border-slate-200 focus:border-practika text-xs px-3 py-2.5 rounded-xl font-bold outline-none cursor-pointer text-slate-700"
                      >
                        <option value="practiker">Operario (Para el Modo Operador Planta)</option>
                        <option value="admin">Administrador (Para la Caja Central / SGC)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-black text-slate-450 uppercase tracking-wider mb-1">
                        Usuario de Logueo (Nick sin espacios)
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. edwin o mariacaja"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-practika text-xs px-3 py-2.5 rounded-xl font-mono font-black text-orange-950 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-slate-450 uppercase tracking-wider mb-1">
                        Contraseña (Clave para ingresar)
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. edwinpractika"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-practika text-xs px-3 py-2.5 rounded-xl font-mono font-black text-slate-800 outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => registerOrUpdateUser(newUsername, newRole, newName, newPassword)}
                    className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition shadow-md flex items-center justify-center gap-1.5"
                  >
                    Generar Credenciales & Guardar Registro
                  </button>
                </div>
              </div>

            </div>

            {/* Footer option to reset defaults */}
            <div className="p-4 bg-slate-100/60 border-t border-slate-150 flex justify-between items-center shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (confirm('¿Desea restaurar los usuarios de demostración por defecto? Se perderán las cuentas creadas manualmente.')) {
                    localStorage.removeItem('practika_users');
                    localStorage.removeItem('practika_passwords');
                    window.location.reload();
                  }
                }}
                className="text-[12px] font-bold text-slate-450 hover:text-slate-600 underline"
              >
                Restaurar fábrica
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSecretAdminModalOpen(false);
                  setNewUsername('');
                  setNewPassword('');
                  setNewName('');
                }}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Cerrar Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING GEMINI ASSISTANT MODAL (CHEF ALVARY INSIGHT CO-OP) */}
      {isAssistantOpen && (
        <div id="ai-assistant-modal" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border-2 border-vibrant">
            
            {/* CHAT HEADER */}
            <div className="p-5 bg-gradient-to-r from-practika to-teal text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow">
                  👨‍🍳
                </div>
                <div>
                  <h4 className="font-extrabold text-sm leading-tight">Chef Álvaro Ibañez Peluffo</h4>
                  <p className="text-[12px] text-[#A6E1E4] uppercase tracking-wider font-semibold">Taller Directivo PRACTIKA</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAssistantOpen(false)}
                className="text-white hover:text-slate-200 font-black text-xs uppercase bg-white/15 px-3 py-1.5 rounded-full"
              >
                Cerrar
              </button>
            </div>

            {/* CHAT BODY CHATTER HISTORIC */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50">
              {assistantHistory.map((item, i) => (
                <div key={i} className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-4 max-w-[85%] rounded-[1.8rem] text-xs leading-relaxed ${
                    item.role === 'user' 
                      ? 'bg-vibrant text-white shadow-md rounded-tr-none' 
                      : 'bg-white text-slate-700 border border-slate-200 shadow-sm rounded-tl-none'
                  }`}>
                    {item.role === 'assistant' ? (
                      <div>
                        {renderSimpleMarkdown(item.text)}
                      </div>
                    ) : (
                      item.text
                    )}
                  </div>
                </div>
              ))}
              {isChefLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-3xl border border-slate-200 text-xs flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-vibrant animate-ping shrink-0"></span>
                    <span className="text-slate-500 font-medium font-mono">El Chef Álvaro está consultando el SGC...</span>
                  </div>
                </div>
              )}
            </div>

            {/* SUGGESTED PREDEFINED TRIGGERS */}
            <div className="p-3 border-t bg-slate-100 flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none shrink-0 border-slate-200">
              {activeRole === 'practiker' ? (
                <>
                  <button 
                    onClick={() => handlePredefinedQuickMsg("¿Cómo calibrar la campana al vacío para bases y salsas?")} 
                    className="bg-white hover:bg-slate-50 border text-[12px] font-bold text-slate-600 px-3 py-1 rounded-full transition"
                  >
                    Calibrar Campana
                  </button>
                  <button 
                    onClick={() => handlePredefinedQuickMsg("Protocolo de choque térmico para pollo en Sous-vide.")}
                    className="bg-white hover:bg-slate-50 border text-[12px] font-bold text-slate-600 px-3 py-1 rounded-full transition"
                  >
                    Choque Térmico
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => handlePredefinedQuickMsg("¿Cuánto tiempo dura la pasta de ajo al vacío en el freezer?")}
                    className="bg-white hover:bg-slate-50 border text-[12px] font-bold text-slate-600 px-3 py-1 rounded-full transition"
                  >
                    Duración al Vacío
                  </button>
                  <button 
                    onClick={() => handlePredefinedQuickMsg("Ideas de recetas rápidas usando la base criolla.")} 
                    className="bg-white hover:bg-slate-50 border text-[12px] font-bold text-slate-600 px-3 py-1 rounded-full transition"
                  >
                    Ideas Receta Criolla
                  </button>
                </>
              )}
            </div>

            {/* CHAT INPUT BAR */}
            <form onSubmit={handleAskChefAlvaro} className="p-4 border-t border-slate-200 flex gap-2 shrink-0 bg-white">
              <input
                type="text"
                value={chefPrompt}
                onChange={(e) => setChefPrompt(e.target.value)}
                placeholder="Pregúntale al Chef sobre inocuidad, recetas o técnicas..."
                className="flex-1 bg-slate-100 border border-slate-300 rounded-full px-4 py-2.5 text-xs focus:outline-none focus:border-vibrant text-slate-700"
              />
              <button
                type="submit"
                disabled={isChefLoading || !chefPrompt.trim()}
                className="bg-vibrant text-white w-9 h-9 rounded-full flex items-center justify-center hover:bg-vibrant/90 transition shadow shrink-0 disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
