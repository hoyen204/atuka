"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { useApiClient } from "@/lib/api.utils";
import {
  TestTube,
  Loader2,
  Globe,
  XCircle,
  CheckCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ProxyInput {
  host: string;
  port: number;
  username?: string;
  password?: string;
}

interface ProxyResult extends ProxyInput {
  success: boolean;
  message: string;
  ip?: string;
}

export default function ProxyCheckerPage() {
  const { user, isAuthenticated, isLoading, isMounted } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const api = useApiClient();

  const [input, setInput] = useState("");
  const [results, setResults] = useState<ProxyResult[]>([]);
  const [checking, setChecking] = useState(false);
  const [loadingProxies, setLoadingProxies] = useState(false);

  useEffect(() => {
    if (isMounted && !isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, isMounted, router]);

  const parseInput = (): ProxyInput[] => {
    return input
      .split(/\n|\r/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(":");
        const [host, portStr, username, password] = parts;
        return {
          host,
          port: parseInt(portStr),
          username,
          password,
        } as ProxyInput;
      })
      .filter((p) => p.host && p.port);
  };

  const handleCheck = async () => {
    const proxies = parseInput();
    if (proxies.length === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập danh sách proxy hợp lệ (host:port[:username:password])",
        variant: "destructive",
        type: "error",
      });
      return;
    }

    setChecking(true);
    setResults([]);

    const promises = proxies.map(async (proxy) => {
      try {
        const data = await api.post("/api/proxies/test", proxy, {
          showLoading: false,
        });
        return {
          ...proxy,
          success: data.success,
          message: data.message,
          ip: data.ip,
        } as ProxyResult;
      } catch (error: any) {
        return {
          ...proxy,
          success: false,
          message: error.message || "Error",
        } as ProxyResult;
      }
    });

    const resultsData = await Promise.all(promises);
    setResults(resultsData);
    setChecking(false);
  };

  const loadMyProxies = async () => {
    if (loadingProxies) return;
    setLoadingProxies(true);
    try {
      const params = new URLSearchParams({ page: '1', limit: '1000' });
      const data = await api.get(`/api/proxies?${params}`, { showLoading: false });
      const lines = data.proxies.map((p: any) => {
        if (p.username) {
          return `${p.host}:${p.port}:${p.username}:${p.password || ''}`;
        }
        return `${p.host}:${p.port}`;
      });
      setInput(lines.join('\n'));
      toast({ title: 'Đã tải proxy', description: `${lines.length} proxy đã được tải` });
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message || 'Không thể tải proxy', variant: 'destructive', type: 'error' });
    } finally {
      setLoadingProxies(false);
    }
  };

  if (!isMounted || isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  return (
    <div className="h-full flex flex-col p-6">
      <div className="space-y-2 mb-6">
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <TestTube className="w-10 h-10 text-primary" />
          Proxy Checker
        </h1>
        <p className="text-muted-foreground text-lg">
          Kiểm tra danh sách proxy nhanh chóng
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Danh sách proxy</CardTitle>
          <CardDescription>
            Nhập mỗi proxy trên một dòng. Cú pháp: host:port hoặc host:port:username:password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            className="min-h-[150px]"
            placeholder="127.0.0.1:8080:user:pass"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={handleCheck} disabled={checking} className="gap-2">
              {checking && <Loader2 className="w-4 h-4 animate-spin" />}
              Kiểm tra
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setInput("");
                setResults([]);
              }}
            >
              Xóa
            </Button>
            <Button variant="outline" onClick={loadMyProxies} disabled={loadingProxies} className="gap-2">
              {loadingProxies && <Loader2 className="w-4 h-4 animate-spin" />}
              Load my proxy
            </Button>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader>
            <CardTitle>Kết quả</CardTitle>
            <CardDescription>
              Đã kiểm tra {results.length.toLocaleString()} proxy
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead>Proxy</TableHead>
                  <TableHead>Kết quả</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((res, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-primary" />
                        {res.host}:{res.port}
                      </div>
                    </TableCell>
                    <TableCell>
                      {res.success ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" /> Thành công
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600">
                          <XCircle className="w-4 h-4" /> Thất bại
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{res.ip || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 