"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaginationComponent } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/useToast";
import { useApiClient } from "@/lib/api.utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Edit,
  Trash2,
  Users,
  Plus,
  Search,
  UserPlus,
  UserMinus,
  ArrowRight,
  ArrowLeft,
  Filter,
  X,
  Check,
  Loader2,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";

interface UserGroup {
  id: number;
  name: string;
  label: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    accountGroups: number;
  };
}

interface Account {
  id: number;
  name: string;
  cultivation?: number;
  gem?: number;
  fairyGem?: number;
  coin?: number;
  lockCoin?: number;
  clanName?: string;
  clanRole?: string;
  toggle: boolean;
}

interface AccountGroup {
  accountId: number;
  groupId: number;
  account: Account;
}

interface UserGroupDetail extends UserGroup {
  accountGroups: AccountGroup[];
}

export default function UserGroupsPage() {
  // Main data states
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [ungroupedAccounts, setUngroupedAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [saving, setSaving] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Search and filter states
  const [search, setSearch] = useState("");
  const [accountSearch, setAccountSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clanFilter, setClanFilter] = useState<string>("all");

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showManageAccountsDialog, setShowManageAccountsDialog] = useState(false);

  // Selected states
  const [selectedGroup, setSelectedGroup] = useState<UserGroupDetail | null>(null);
  const [selectedAccountsToAdd, setSelectedAccountsToAdd] = useState<number[]>([]);
  const [selectedAccountsToRemove, setSelectedAccountsToRemove] = useState<number[]>([]);
  const [formData, setFormData] = useState({ name: "", label: "" });

  const { toast } = useToast();
  const apiClient = useApiClient();

  const pageSize = 10;

  // Filtered accounts based on search and filters
  const filteredUngroupedAccounts = useMemo(() => {
    return ungroupedAccounts.filter(account => {
      const matchesSearch = account.name.toLowerCase().includes(accountSearch.toLowerCase()) ||
                          (account.clanName?.toLowerCase().includes(accountSearch.toLowerCase()) ?? false);
      const matchesStatus = statusFilter === "all" ||
                          (statusFilter === "active" && account.toggle) ||
                          (statusFilter === "inactive" && !account.toggle);
      const matchesClan = clanFilter === "all" || account.clanName === clanFilter;

      return matchesSearch && matchesStatus && matchesClan;
    });
  }, [ungroupedAccounts, accountSearch, statusFilter, clanFilter]);

  // Get unique clan names for filter
  const uniqueClans = useMemo(() => {
    const clans = new Set<string>();
    ungroupedAccounts.forEach(account => {
      if (account.clanName) clans.add(account.clanName);
    });
    return Array.from(clans).sort();
  }, [ungroupedAccounts]);

  const fetchUserGroups = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(
        `/api/user-groups?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}`
      );

      if (response) {
        setUserGroups(response.userGroups || []);
        setTotalPages(response.totalPages || 1);
        setTotal(response.total || 0);
      } else {
        throw new Error("Failed to fetch user groups");
      }
    } catch (error) {
      console.error('Error fetching user groups:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user groups. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUngroupedAccounts = async () => {
    try {
      setLoadingAccounts(true);
      const response = await apiClient.get('/api/accounts/ungrouped?pageSize=100');
      if (response && response.accounts) {
        setUngroupedAccounts(response.accounts);
      } else {
        throw new Error("Failed to fetch ungrouped accounts");
      }
    } catch (error) {
      console.error('Failed to fetch ungrouped accounts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch ungrouped accounts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingAccounts(false);
    }
  };

  const fetchGroupDetail = async (groupId: number) => {
    try {
      setLoadingAccounts(true);
      const response = await apiClient.get(`/api/user-groups/${groupId}`);
      if (response && response.userGroup) {
        setSelectedGroup(response.userGroup);
      } else {
        throw new Error("Failed to fetch group details");
      }
    } catch (error) {
      console.error('Error fetching group details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch group details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleCreateGroup = async () => {
    try {
      const response = await apiClient.post('/api/user-groups', formData);
      if (response) {
        toast({
          title: "Success",
          description: "User group created successfully",
        });
        setShowCreateDialog(false);
        setFormData({ name: "", label: "" });
        fetchUserGroups();
      } else {
        const error = response.error;
        toast({
          title: "Error",
          description: error.error || "Failed to create user group",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create user group",
        variant: "destructive",
      });
    }
  };

  const handleUpdateGroup = async () => {
    if (!selectedGroup) return;

    try {
      const response = await apiClient.put(`/api/user-groups/${selectedGroup.id}`, formData);
      if (response) {
        toast({
          title: "Success",
          description: "User group updated successfully",
        });
        setShowEditDialog(false);
        setFormData({ name: "", label: "" });
        fetchUserGroups();
      } else {
        const error = response.error;
        toast({
          title: "Error",
          description: error.error || "Failed to update user group",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user group",
        variant: "destructive",
      });
    }
  };

  const handleDeleteGroup = async (groupId: number) => {
    if (!confirm("Are you sure you want to delete this user group?")) return;

    try {
      const response = await apiClient.delete(`/api/user-groups/${groupId}`);
      if (response) {
        toast({
          title: "Success",
          description: "User group deleted successfully",
        });
        fetchUserGroups();
      } else {
        const error = response.error;
        toast({
          title: "Error",
          description: error.error || "Failed to delete user group",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user group",
        variant: "destructive",
      });
    }
  };

  const handleAddAccountsToGroup = async () => {
    if (!selectedGroup || selectedAccountsToAdd.length === 0) return;

    try {
      setSaving(true);
      const response = await apiClient.post(`/api/user-groups/${selectedGroup.id}/accounts`, {
        accountIds: selectedAccountsToAdd
      });
      if (response) {
        const data = await response.json();
        toast({
          title: "Success",
          description: `Successfully added ${selectedAccountsToAdd.length} account(s) to group`,
        });
        setSelectedAccountsToAdd([]);
        await Promise.all([
          fetchGroupDetail(selectedGroup.id),
          fetchUngroupedAccounts()
        ]);
      } else {
        const error = response.error;
        throw new Error(error.error || "Failed to add accounts to group");
      }
    } catch (error) {
      console.error('Error adding accounts to group:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add accounts to group",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAccountsFromGroup = async () => {
    if (!selectedGroup || selectedAccountsToRemove.length === 0) return;

    try {
      setSaving(true);
      const response = await apiClient.delete(`/api/user-groups/${selectedGroup.id}/accounts`, {
        body: JSON.stringify({ accountIds: selectedAccountsToRemove })
      });
      if (response) {
        toast({
          title: "Success",
          description: `Successfully removed ${selectedAccountsToRemove.length} account(s) from group`,
        });
        setSelectedAccountsToRemove([]);
        await Promise.all([
          fetchGroupDetail(selectedGroup.id),
          fetchUngroupedAccounts()
        ]);
      } else {
        const error = response.error;
        throw new Error(error.error || "Failed to remove accounts from group");
      }
    } catch (error) {
      console.error('Error removing accounts from group:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove accounts from group",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Transfer functions for better UX
  const moveToGroup = (accountIds: number[]) => {
    setSelectedAccountsToAdd(prev => [...new Set([...prev, ...accountIds])]);
  };

  const removeFromGroup = (accountIds: number[]) => {
    setSelectedAccountsToRemove(prev => [...new Set([...prev, ...accountIds])]);
  };

  const moveAllToGroup = () => {
    const allIds = filteredUngroupedAccounts.map(account => account.id);
    setSelectedAccountsToAdd(prev => [...new Set([...prev, ...allIds])]);
  };

  const removeAllFromGroup = () => {
    const allIds = selectedGroup?.accountGroups?.map(ag => ag.accountId) || [];
    setSelectedAccountsToRemove(prev => [...new Set([...prev, ...allIds])]);
  };

  const openEditDialog = (group: UserGroup) => {
    setSelectedGroup(group as UserGroupDetail);
    setFormData({ name: group.name, label: group.label });
    setShowEditDialog(true);
  };

  const openManageAccountsDialog = async (group: UserGroup) => {
    setSelectedGroup(group as UserGroupDetail);
    setSelectedAccountsToAdd([]);
    setSelectedAccountsToRemove([]);
    setAccountSearch("");
    setStatusFilter("all");
    setClanFilter("all");
    setShowManageAccountsDialog(true);
    await Promise.all([
      fetchGroupDetail(group.id),
      fetchUngroupedAccounts()
    ]);
  };

  const resetFilters = () => {
    setAccountSearch("");
    setStatusFilter("all");
    setClanFilter("all");
  };

  useEffect(() => {
    fetchUserGroups();
  }, [page, search]);

  // Keyboard shortcuts and accessibility
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ESC to close dialogs
      if (event.key === 'Escape') {
        if (showManageAccountsDialog) {
          setShowManageAccountsDialog(false);
        } else if (showEditDialog) {
          setShowEditDialog(false);
        } else if (showCreateDialog) {
          setShowCreateDialog(false);
        }
      }

      // Ctrl/Cmd + N to create new group
      if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault();
        if (!showCreateDialog && !showEditDialog && !showManageAccountsDialog) {
          setShowCreateDialog(true);
        }
      }

      // Ctrl/Cmd + F to focus search
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search groups"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showCreateDialog, showEditDialog, showManageAccountsDialog]);

  // Auto-focus management
  useEffect(() => {
    if (showCreateDialog) {
      setTimeout(() => {
        const nameInput = document.getElementById('name');
        if (nameInput) nameInput.focus();
      }, 100);
    }
  }, [showCreateDialog]);

  useEffect(() => {
    if (showEditDialog) {
      setTimeout(() => {
        const nameInput = document.getElementById('edit-name');
        if (nameInput) nameInput.focus();
      }, 100);
    }
  }, [showEditDialog]);

  useEffect(() => {
    if (showManageAccountsDialog) {
      setTimeout(() => {
        const searchInput = document.querySelector('input[placeholder*="Search accounts"]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }, 100);
    }
  }, [showManageAccountsDialog]);

  const handleSearch = () => {
    setPage(1);
    fetchUserGroups();
  };

  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return "0";
    return new Intl.NumberFormat().format(num);
  };

  // Skeleton loading component for table rows
  const TableSkeleton = () => (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={`skeleton-${index}`}>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell className="hidden sm:table-cell">
            <Skeleton className="h-5 w-16" />
          </TableCell>
          <TableCell className="hidden md:table-cell">
            <Skeleton className="h-5 w-12" />
          </TableCell>
          <TableCell className="hidden lg:table-cell">
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <div className="flex gap-1">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );

  // Empty state component for lists
  const EmptyState = ({ icon: Icon, title, description }: { icon: any; title: string; description: string }) => (
    <div className="text-center py-8 text-muted-foreground">
      <Icon className="w-12 h-12 mx-auto mb-3 opacity-50" />
      <h3 className="font-medium mb-1">{title}</h3>
      <p className="text-sm">{description}</p>
    </div>
  );

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">User Groups Management</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Organize your accounts into groups for better management
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-center">
                <div>Create new user group</div>
                <div className="text-xs text-muted-foreground mt-1">Ctrl+N</div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Input
                        placeholder="Search groups by name or label..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                        aria-label="Search user groups"
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-center">
                        <div>Search user groups</div>
                        <div className="text-xs text-muted-foreground mt-1">Ctrl+F</div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Button onClick={handleSearch} variant="default" className="w-full sm:w-auto">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
            {search && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                <span className="flex-1">Searching for: "{search}"</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                    fetchUserGroups();
                  }}
                  className="h-auto p-1 w-fit"
                >
                  <X className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User Groups</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">Name</TableHead>
                <TableHead className="hidden sm:table-cell">Label</TableHead>
                <TableHead className="hidden md:table-cell min-w-[100px]">Accounts</TableHead>
                <TableHead className="hidden lg:table-cell min-w-[120px]">Created</TableHead>
                <TableHead className="min-w-[140px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton />
              ) : userGroups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No user groups found
                  </TableCell>
                </TableRow>
              ) : (
                userGroups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{group.name}</span>
                        <span className="text-xs text-muted-foreground sm:hidden">
                          <Badge variant="outline" className="text-xs">{group.label}</Badge>
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline">{group.label}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="secondary" className="text-xs">
                        {group._count.accountGroups}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">
                      {new Date(group.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openManageAccountsDialog(group)}
                                className="h-8 w-8 p-0"
                              >
                                <Users className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Manage Accounts</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(group)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit Group</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteGroup(group.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete Group</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
              </Table>

              {!loading && userGroups.length > 0 && (
                <div className="mt-4">
                  <PaginationComponent
                    currentPage={page}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    total={total || 0}
                    onPageChange={setPage}
                  />
                </div>
              )}
        </CardContent>
      </Card>

      {/* Create Group Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md" role="dialog" aria-labelledby="create-group-title" aria-describedby="create-group-description">
          <DialogHeader>
            <DialogTitle id="create-group-title" className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create User Group
            </DialogTitle>
            <p id="create-group-description" className="text-sm text-muted-foreground">
              Create a new user group to organize your accounts
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter group name"
                onKeyPress={(e) => e.key === "Enter" && handleCreateGroup()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="label">Group Label</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="Enter unique label"
                onKeyPress={(e) => e.key === "Enter" && handleCreateGroup()}
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button onClick={handleCreateGroup} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md" role="dialog" aria-labelledby="edit-group-title" aria-describedby="edit-group-description">
          <DialogHeader>
            <DialogTitle id="edit-group-title" className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit User Group
            </DialogTitle>
            <p id="edit-group-description" className="text-sm text-muted-foreground">
              Modify the selected user group details
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Group Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter group name"
                onKeyPress={(e) => e.key === "Enter" && handleUpdateGroup()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-label">Group Label</Label>
              <Input
                id="edit-label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="Enter unique label"
                onKeyPress={(e) => e.key === "Enter" && handleUpdateGroup()}
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowEditDialog(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button onClick={handleUpdateGroup} className="w-full sm:w-auto">
                <Check className="w-4 h-4 mr-2" />
                Update Group
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Accounts Dialog */}
      <Dialog open={showManageAccountsDialog} onOpenChange={setShowManageAccountsDialog}>
        <DialogContent
          className="max-w-6xl max-h-[90vh] overflow-hidden"
          role="dialog"
          aria-labelledby="manage-accounts-title"
          aria-describedby="manage-accounts-description"
        >
          <DialogHeader>
            <DialogTitle id="manage-accounts-title" className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Manage Accounts - {selectedGroup?.name}
            </DialogTitle>
            <p id="manage-accounts-description" className="text-sm text-muted-foreground">
              Add or remove accounts from this user group. Use filters to find specific accounts.
            </p>
          </DialogHeader>

          {loadingAccounts ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading accounts...
            </div>
          ) : (
            <div className="space-y-4">
              {/* Filters */}
              <Card>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="sm:col-span-2 lg:col-span-1">
                      <Input
                        placeholder="Search accounts..."
                        value={accountSearch}
                        onChange={(e) => setAccountSearch(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={clanFilter} onValueChange={setClanFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Clan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Clans</SelectItem>
                        {uniqueClans.map(clan => (
                          <SelectItem key={clan} value={clan}>{clan}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {(accountSearch || statusFilter !== "all" || clanFilter !== "all") && (
                      <Button variant="outline" onClick={resetFilters} size="sm" className="w-full sm:w-auto">
                        <X className="w-4 h-4 mr-1" />
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Transfer Interface */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Current Group Members */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      Group Members
                      <Badge variant="secondary">
                        {selectedGroup?.accountGroups?.length || 0}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {/* Bulk Actions */}
                      {selectedGroup?.accountGroups && selectedGroup.accountGroups.length > 0 && (
                        <div className="flex gap-2 mb-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={removeAllFromGroup}
                            disabled={saving}
                          >
                            Select All
                          </Button>
                          {selectedAccountsToRemove.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedAccountsToRemove([])}
                            >
                              Clear ({selectedAccountsToRemove.length})
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Members List */}
                      <div
                        className="max-h-80 overflow-y-auto border rounded-md"
                        role="listbox"
                        aria-label="Current group members"
                      >
                        {selectedGroup?.accountGroups?.map((accountGroup) => {
                          const isSelected = selectedAccountsToRemove.includes(accountGroup.accountId);
                          return (
                            <div
                              key={accountGroup.accountId}
                              className={`flex items-center justify-between p-3 border-b last:border-b-0 cursor-pointer hover:bg-muted/50 ${
                                isSelected ? 'bg-blue-50 border-blue-200' : ''
                              }`}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedAccountsToRemove(prev => prev.filter(id => id !== accountGroup.accountId));
                                } else {
                                  setSelectedAccountsToRemove(prev => [...prev, accountGroup.accountId]);
                                }
                              }}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                                  isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                                }`}>
                                  {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{accountGroup.account.name}</span>
                                    <Badge variant={accountGroup.account.toggle ? "default" : "secondary"} className="text-xs">
                                      {accountGroup.account.toggle ? "Active" : "Inactive"}
                                    </Badge>
                                  </div>
                                  {accountGroup.account.clanName && (
                                    <Badge variant="outline" className="text-xs mt-1">
                                      {accountGroup.account.clanName}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFromGroup([accountGroup.accountId]);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <ArrowLeft className="w-4 h-4" />
                              </Button>
                            </div>
                          );
                        })}
                        {(!selectedGroup?.accountGroups || selectedGroup.accountGroups.length === 0) && (
                          <EmptyState
                            icon={Users}
                            title="No accounts in this group"
                            description="Add accounts using the transfer buttons or select them from the available list"
                          />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Available Accounts */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      Available Accounts
                      <Badge variant="secondary">
                        {filteredUngroupedAccounts.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {/* Bulk Actions */}
                      {filteredUngroupedAccounts.length > 0 && (
                        <div className="flex gap-2 mb-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={moveAllToGroup}
                            disabled={saving}
                          >
                            Select All
                          </Button>
                          {selectedAccountsToAdd.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedAccountsToAdd([])}
                            >
                              Clear ({selectedAccountsToAdd.length})
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Available Accounts List */}
                      <div
                        className="max-h-80 overflow-y-auto border rounded-md"
                        role="listbox"
                        aria-label="Available accounts to add"
                      >
                        {filteredUngroupedAccounts.map((account) => {
                          const isSelected = selectedAccountsToAdd.includes(account.id);
                          return (
                            <div
                              key={account.id}
                              className={`flex items-center justify-between p-3 border-b last:border-b-0 cursor-pointer hover:bg-muted/50 ${
                                isSelected ? 'bg-green-50 border-green-200' : ''
                              }`}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedAccountsToAdd(prev => prev.filter(id => id !== account.id));
                                } else {
                                  setSelectedAccountsToAdd(prev => [...prev, account.id]);
                                }
                              }}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                                  isSelected ? 'bg-green-500 border-green-500' : 'border-gray-300'
                                }`}>
                                  {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{account.name}</span>
                                    <Badge variant={account.toggle ? "default" : "secondary"} className="text-xs">
                                      {account.toggle ? "Active" : "Inactive"}
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    Cultivation: {formatNumber(account.cultivation)} |
                                    Gem: {formatNumber(account.gem)}
                                  </div>
                                  {account.clanName && (
                                    <Badge variant="outline" className="text-xs mt-1">
                                      {account.clanName}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveToGroup([account.id]);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <ArrowRight className="w-4 h-4" />
                              </Button>
                            </div>
                          );
                        })}
                        {filteredUngroupedAccounts.length === 0 && (
                          <EmptyState
                            icon={UserPlus}
                            title={ungroupedAccounts.length === 0 ? "No ungrouped accounts available" : "No accounts match your filters"}
                            description={ungroupedAccounts.length === 0 ? "All accounts are already assigned to groups" : "Try adjusting your search or filter criteria"}
                          />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t">
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {selectedAccountsToRemove.length > 0 && (
                    <span className="flex items-center gap-1">
                      <UserMinus className="w-4 h-4" />
                      To remove: {selectedAccountsToRemove.length}
                    </span>
                  )}
                  {selectedAccountsToAdd.length > 0 && (
                    <span className="flex items-center gap-1">
                      <UserPlus className="w-4 h-4" />
                      To add: {selectedAccountsToAdd.length}
                    </span>
                  )}
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => setShowManageAccountsDialog(false)}
                    className="w-full sm:w-auto"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={handleRemoveAccountsFromGroup}
                    disabled={selectedAccountsToRemove.length === 0 || saving}
                    variant="destructive"
                    className="w-full sm:w-auto"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <UserMinus className="w-4 h-4 mr-2" />
                    )}
                    Remove ({selectedAccountsToRemove.length})
                  </Button>
                  <Button
                    onClick={handleAddAccountsToGroup}
                    disabled={selectedAccountsToAdd.length === 0 || saving}
                    className="w-full sm:w-auto"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4 mr-2" />
                    )}
                    Add ({selectedAccountsToAdd.length})
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
