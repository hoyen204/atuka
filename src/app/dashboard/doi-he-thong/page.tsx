// src/app/dashboard/doi-he-thong/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/useResponsive";
import { useToast } from "@/hooks/useToast";
import { useApiClient } from "@/lib/api.utils";
import { GripVertical, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DndProvider, DropTargetMonitor, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";

// Interfaces (Account, Proxy, System, etc.) go here...
interface Account {
  id: string;
  name: string;
}

interface Proxy {
  id: number;
  name?: string;
  host: string;
  port: number;
}

interface System {
  value: string;
  label: string;
  isCurrent: boolean;
}

interface UnclaimedReward {
  system: string;
  level: string;
}

interface DoiHeThongData {
  currentSystem: string;
  systems: System[];
  availableChanges: number;
  unclaimedRewards: UnclaimedReward[];
}
interface DragItem {
  index: number;
  type: string;
}

const DraggableSystem = ({
  system,
  index,
  moveSystem,
}: {
  system: string;
  index: number;
  moveSystem: (dragIndex: number, hoverIndex: number) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop<
    { index: number; type: string },
    void,
    { handlerId: any }
  >({
    accept: "system",
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor: DropTargetMonitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      moveSystem(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: "system",
    item: () => {
      return { index };
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`flex items-center p-2 bg-secondary rounded mb-2 ${
        isDragging ? "opacity-50" : ""
      }`}
      data-handler-id={handlerId}
    >
      <GripVertical size={16} className="cursor-move" />
      <span className="ml-2">{system}</span>
    </div>
  );
};
export default function DoiHeThongPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [selectedProxy, setSelectedProxy] = useState<string>("random");
  const [data, setData] = useState<DoiHeThongData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [
    currentSystemMessage,
    setCurrentSystemMessage,
  ] = useState<string | null>(null);
  const [orderedSystems, setOrderedSystems] = useState<string[]>([]);
  const api = useApiClient();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    async function fetchInitialData() {
      try {
        const [accRes, proxyRes] = await Promise.all([
          api.get<{ accounts: Account[] }>("/api/accounts?pageSize=1000"),
          api.get<{ proxies: Proxy[] }>("/api/proxies?limit=1000"),
        ]);
        setAccounts(accRes.accounts);
        setProxies(proxyRes.proxies);
        if (accRes.accounts.length > 0) {
          setSelectedAccount(accRes.accounts[0].id);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load accounts or proxies",
          variant: "destructive",
        });
      }
    }
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedAccount) loadData();
  }, [selectedAccount, selectedProxy]);

  async function loadData() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        accountId: selectedAccount!,
        proxyId: selectedProxy,
      });
      const res = await api.get<{ data: DoiHeThongData }>(
        `/api/doi-he-thong?${params}`
      );
      setData(res.data);

      const systemLabels = new Set<string>();
      const uniqueSystems: string[] = [];
      if (res.data && res.data.unclaimedRewards) {
        for (const reward of res.data.unclaimedRewards) {
          const systemValue = getSystemValue(reward.system, res.data.systems);
          if (systemValue) {
            const system = res.data.systems.find(
              (s) => s.value === systemValue
            );
            if (system && !systemLabels.has(system.label)) {
              systemLabels.add(system.label);
              uniqueSystems.push(systemValue);
            }
          }
        }
      }
      setOrderedSystems(uniqueSystems);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function getSystemValue(systemName: string, systems: System[]): string {
    if (!systems || !systemName) return "";
    const trimmedSystemName = systemName.trim();
    const system = systems.find((s) => s.label.includes(trimmedSystemName));
    return system?.value || "";
  }

  function moveSystem(dragIndex: number, hoverIndex: number) {
    const dragSystem = orderedSystems[dragIndex];
    setOrderedSystems((prev) => {
      const newSystems = [...prev];
      newSystems.splice(dragIndex, 1);
      newSystems.splice(hoverIndex, 0, dragSystem);
      return newSystems;
    });
  }

  async function processSystems() {
    setIsProcessing(true);
    setProgress(0);
    setCurrentSystemMessage(null);
    try {
      const totalSystems = orderedSystems.length;
      for (let i = 0; i < totalSystems; i++) {
        const sysValue = orderedSystems[i];
        const system = data?.systems.find((s) => s.value === sysValue);
        const systemLabel = system?.label || sysValue;

        setCurrentSystemMessage(
          `Đang xử lý: ${systemLabel} (${i + 1}/${totalSystems})`
        );

        // Change system
        await api.post("/api/doi-he-thong", {
          accountId: selectedAccount,
          proxyId: selectedProxy,
          system: sysValue,
        });

        // TODO: Claim reward - need to implement claiming logic
        // Perhaps fetch the page again and find the claim button, or separate API

        toast({
          title: "Thành công",
          description: `Đã đổi thành công sang hệ thống: ${systemLabel}`,
        });

        setProgress(Math.round(((i + 1) / totalSystems) * 100));
      }
      setCurrentSystemMessage("Hoàn tất! Đang tải lại dữ liệu...");
      await loadData();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Quá trình xử lý thất bại.",
        variant: "destructive",
      });
      setCurrentSystemMessage("Đã xảy ra lỗi trong quá trình xử lý.");
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        setProgress(0);
        setCurrentSystemMessage(null);
      }, 3000);
    }
  }

  const Backend = isMobile ? TouchBackend : HTML5Backend;

  return (
    <DndProvider backend={Backend}>
      <div className="p-4">
        {/* Account and Proxy selectors similar to user-shop */}
        <div className="grid grid-cols-[1fr_1fr_auto] gap-4 mb-4">
          <Select
            value={selectedAccount || ""}
            onValueChange={setSelectedAccount}
            disabled={isLoading || isProcessing}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedProxy}
            onValueChange={setSelectedProxy}
            disabled={isLoading || isProcessing}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Proxy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="random">Random</SelectItem>
              {proxies.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name || `${p.host}:${p.port}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={loadData}
            disabled={isLoading || isProcessing}
            icon={<RefreshCw className="h-4 w-4" />}
          >
            Refresh
          </Button>
        </div>

        {isLoading && !isProcessing && (
          <div className="flex justify-center items-center">
            <Loader2 className="animate-spin h-8 w-8" />
          </div>
        )}

        {data && !isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="font-bold text-lg mb-2">Thông Tin Hiện Tại</h3>
              <p>
                Hệ thống:{" "}
                <span className="font-semibold">
                  {data.systems.find((s) => s.isCurrent)?.label}
                </span>
              </p>
              <p>
                Số lần đổi còn lại:{" "}
                <span className="font-semibold">{data.availableChanges}</span>
              </p>
            </Card>

            <Card className="p-4">
              <h3 className="font-bold text-lg mb-2">Phần Thưởng Chưa Nhận</h3>
              {data.unclaimedRewards.length > 0 ? (
                <ul>
                  {data.unclaimedRewards.map((r, i) => (
                    <li key={i}>
                      - {r.level} ({r.system})
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Không có phần thưởng nào chưa nhận.</p>
              )}
            </Card>

            <Card className="p-4 md:col-span-2">
              <h3 className="font-bold text-lg mb-2">Tự Động Đổi Hệ Thống</h3>
              {isProcessing ? (
                <div className="space-y-3 pt-2">
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-center text-muted-foreground animate-pulse">
                    {currentSystemMessage}
                  </p>
                </div>
              ) : orderedSystems.length > 0 ? (
                <div>
                  {orderedSystems.map((sysValue, index) => {
                    const systemLabel =
                      data.systems.find((s) => s.value === sysValue)?.label ||
                      sysValue;
                    return (
                      <DraggableSystem
                        key={sysValue}
                        system={systemLabel}
                        index={index}
                        moveSystem={moveSystem}
                      />
                    );
                  })}
                  <Button
                    onClick={processSystems}
                    disabled={isLoading || orderedSystems.length === 0}
                    className="mt-4 w-full"
                  >
                    Bắt đầu tự động
                  </Button>
                </div>
              ) : (
                <p>Không có hệ thống nào để xử lý.</p>
              )}
            </Card>
          </div>
        )}
      </div>
    </DndProvider>
  );
}
