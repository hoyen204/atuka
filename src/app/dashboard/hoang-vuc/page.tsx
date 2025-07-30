'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShopTab } from './components/ShopTab';
import { InventoryTab } from './components/InventoryTab';
import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';

interface Account {
  id: string;
  name: string;
}
interface Proxy {
  id: number;
  host: string;
  port: number;
  username?: string;
  name?: string;
}

export default function HoangVucPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [selectedProxy, setSelectedProxy] = useState<string>("random");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUserBalance, setIsLoadingUserBalance] = useState(false);
  const [inventoryData, setInventoryData] = useState<any>(null);
  const [userBalance, setUserBalance] = useState<any>(null);
  const toast = useToast();

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [accRes, proxyRes] = await Promise.all([
          fetch("/api/accounts?pageSize=1000"),
          fetch("/api/proxies?limit=1000"),
        ]);
        const accData = await accRes.json();
        const proxyData = await proxyRes.json();
        setAccounts(accData.accounts || []);
        setProxies(proxyData.proxies || []);
        if (accData.accounts?.length > 0) {
          setSelectedAccount(accData.accounts[0].id);
        }
      } catch (error) {
        toast.toast({
          title: "Lỗi",
          description: "Không thể tải danh sách tài khoản hoặc proxy.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedAccount) return;
    setIsLoading(true);
    setIsLoadingUserBalance(true);
    fetchInventory();
    fetchUserBalance();
  }, [selectedAccount, selectedProxy]);

  async function fetchInventory() {
    try {
      const params = new URLSearchParams({
        accountId: selectedAccount || "",
        proxyId: selectedProxy,
      });
      const response = await fetch(`/api/hoang-vuc/inventory?${params}`);
      if (!response.ok) throw new Error('Failed to fetch inventory');
      const data = await response.json();
      setInventoryData(data);
    } catch (error) {
      toast.toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu inventory.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchUserBalance() {
    try {
      const params = new URLSearchParams({
        accountId: selectedAccount || "",
        proxyId: selectedProxy,
      });
      const response = await fetch(`/api/hoang-vuc/user-balance?${params}`);
      const data = await response.json();
      if (!response.ok || !data.success) {
        toast.toast({
          title: "Lỗi",
          description: data.message || "Không thể tải dữ liệu user balance.",
          variant: "destructive",
        });
        return;
      }
      setUserBalance(data.data);
    } catch (error) {
      toast.toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu user balance.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingUserBalance(false);
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Hoang Vực</h1>
      <div className="flex flex-col md:flex-row gap-4 items-end justify-end mb-4">
        <div className="w-1/6">
          <Select
            onValueChange={setSelectedAccount}
            value={selectedAccount || undefined}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn tài khoản" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-1/6">
          <Select onValueChange={setSelectedProxy} value={selectedProxy}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn proxy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="random">Ngẫu nhiên</SelectItem>
              {proxies.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name || `${p.host}:${p.port}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Tabs defaultValue="shop" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="shop">Tiệm</TabsTrigger>
          <TabsTrigger value="inventory">Túi</TabsTrigger>
        </TabsList>
        <TabsContent value="shop">
          <ShopTab
            isLoading={isLoadingUserBalance}
            selectedAccount={selectedAccount}
            selectedProxy={selectedProxy}
            userBalance={userBalance}
            onRefresh={fetchUserBalance}
            toast={toast}
          />
        </TabsContent>
        <TabsContent value="inventory">
          <InventoryTab
            inventoryData={inventoryData}
            isLoading={isLoading}
            selectedAccount={selectedAccount}
            selectedProxy={selectedProxy}
            onRefresh={fetchInventory}
            toast={toast}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}