'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, User, ChevronsRight, Globe, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

interface Account {
  id: string;
  name: string;
  cultivation: number | null;
  clanName: string | null;
}

interface Proxy {
  id: string;
  host: string;
  port: number;
  username: string;
  password: string;
}

export default function ClanSelectionPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [selectedProxy, setSelectedProxy] = useState<string>('random');
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsDataLoading(true);
      try {
        const [accRes, proxyRes] = await Promise.all([
          fetch('/api/accounts'),
          fetch('/api/proxies'), // Assuming you have a proxies API
        ]);

        if (accRes.ok) {
          const accData = await accRes.json();
          setAccounts(accData.accounts);
        } else {
          toast.error('Không thể tải danh sách tài khoản.');
        }

        if (proxyRes.ok) {
          const proxyData = await proxyRes.json();
          setProxies(proxyData.proxies);
        } else {
          // It's okay if proxies fail to load, we can default to random
          console.warn('Could not load proxies, defaulting to random.');
        }

      } catch (error) {
        toast.error('Đã xảy ra lỗi khi tải dữ liệu.');
        console.error('Fetch error:', error);
      } finally {
        setIsDataLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleLoadClanData = () => {
    if (!selectedAccount) {
      toast.error('Vui lòng chọn một tài khoản để tiếp tục.');
      return;
    }
    setIsLoading(true);
    toast.info(`Đang tải dữ liệu tông môn cho tài khoản ${selectedAccount}...`);

    // Simulate loading and redirect
    setTimeout(() => {
      router.push(`/dashboard/clan-management?accountId=${selectedAccount}&proxyId=${selectedProxy}`);
    }, 2000);
  };

  if (isDataLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-blue-600" size={64} />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-2xl shadow-2xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <Shield size={48} className="mx-auto text-blue-600 mb-4" />
          <CardTitle className="text-3xl font-bold">Tải Dữ Liệu Tông Môn</CardTitle>
          <CardDescription>
            Chọn tài khoản và proxy để bắt đầu truy vấn thông tin tông môn
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 p-8">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <User className="text-gray-600" />
              1. Chọn tài khoản thực thi
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {accounts.map(acc => (
                <button
                  key={acc.id}
                  onClick={() => setSelectedAccount(acc.id)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    selectedAccount === acc.id
                      ? 'border-blue-500 bg-blue-50 scale-105 shadow-lg'
                      : 'bg-gray-50 hover:bg-gray-100 hover:border-gray-300'
                  }`}
                >
                  <p className="font-bold">{acc.name}</p>
                  <p className="text-sm text-gray-500">Tu vi: {acc.cultivation?.toLocaleString() || 'N/A'}</p>
                  <p className="text-sm text-gray-500">{acc.clanName || 'Chưa vào clan'}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Globe className="text-gray-600" />
              2. Chọn Proxy (Tùy chọn)
            </h3>
            <Select
              value={selectedProxy}
              onValueChange={setSelectedProxy}
              disabled={!selectedAccount}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn một proxy..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="random">Sử dụng Proxy Ngẫu Nhiên</SelectItem>
                {proxies.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    http://{p.host}:{p.port}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Nếu không chọn, hệ thống sẽ tự động sử dụng một proxy ngẫu nhiên từ danh sách.
            </p>
          </div>
          
          <Button
            onClick={handleLoadClanData}
            disabled={!selectedAccount || isLoading}
            className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white"
          >
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tải...</>
            ) : (
              <>
                Xem thông tin Tông Môn
                <ChevronsRight className="ml-2" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 