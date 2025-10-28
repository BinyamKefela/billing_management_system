"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getAuthToken } from "@/app/auth/login/api";
import { toast } from "react-toastify";
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  Plus,
  Users,
  Search,
  Shield,
  Check,
  Key,
  UserCheck,
} from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const groupSchema = z.object({
  name: z
    .string()
    .min(1, "Group name is required")
    .max(100, "Group name too long"),
});

type GroupFormData = z.infer<typeof groupSchema>;

type Permission = {
  id: number;
  codename: string;
  name: string;
  content_type?: string;
};

type CustomGroup = {
  id: number;
  name: string;
  permissions: Permission[];
  user_count: number;
};

export default function GroupsPage() {
  const [groups, setGroups] = useState<CustomGroup[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CustomGroup | null>(null);
  const [modalType, setModalType] = useState<"add" | "edit" | "view" | "delete" | "permissions" | null>(null);
  const [button_clicked, setButtonClicked] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 1000);
    return () => clearTimeout(t);
  }, [search]);

  const fetchPermissions = async () => {
    try {
      const res = await fetch(`${BASE_URL}/get_permissions?page_size=9999`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setAvailablePermissions(data.data || data.results || []);
      } else {
        setAvailablePermissions([]);
      }
    } catch (error) {
      setAvailablePermissions([]);
    }
  };

  const fetchGroups = async () => {
    setLoading(true);
    try {
      let url = `${BASE_URL}/get_groups?page=${page}&search=${encodeURIComponent(
        debouncedSearch
      )}`;

      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      const data = await res.json();
      if (res.status === 200) {
        setGroups(data.data || data.results || []);
        setTotalPages(data.total_pages || 1);
      } else {
        toast.error(data.error || "Failed to load groups");
      }
    } catch {
      toast.error("Couldn't fetch groups");
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupPermissions = async (groupId: number) => {
    try {
      const res = await fetch(`${BASE_URL}/get_group_permission`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ group_id: groupId }),
      });
      
      if (res.ok) {
        const data = await res.json();
        return data.group_permissions || [];
      } else {
        return [];
      }
    } catch (error) {
      return [];
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchPermissions();
  }, [page, debouncedSearch]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
  });

  const handlePermissionToggle = (permissionCodename: string) => {
    const newPermissions = selectedPermissions.includes(permissionCodename)
      ? selectedPermissions.filter((codename) => codename !== permissionCodename)
      : [...selectedPermissions, permissionCodename];

    setSelectedPermissions(newPermissions);
  };

  const isPermissionSelected = (permissionCodename: string) => {
    return selectedPermissions.includes(permissionCodename);
  };

  const handleOpen = async (type: typeof modalType, group?: CustomGroup) => {
    setModalType(type);
    setSelected(group || null);

    if (group) {
      if (type === "permissions") {
        try {
          const currentPermissions = await fetchGroupPermissions(group.id);
          let permissionCodenames: string[] = [];
          
          if (Array.isArray(currentPermissions)) {
            if (currentPermissions.length > 0) {
              if (typeof currentPermissions[0] === 'object') {
                permissionCodenames = currentPermissions.map((p: any) => p.codename || p.name || p[0]);
              } else {
                permissionCodenames = currentPermissions;
              }
            }
          }
          setSelectedPermissions(permissionCodenames);
        } catch (error) {
          const groupPermissionCodenames = group.permissions?.map((p) => p.codename) || [];
          setSelectedPermissions(groupPermissionCodenames);
        }
      } else {
        const groupPermissionCodenames = group.permissions?.map((p) => p.codename) || [];
        setSelectedPermissions(groupPermissionCodenames);
      }
      
      reset({
        name: group.name,
      });
    } else {
      setSelectedPermissions([]);
      reset({
        name: "",
      });
    }
  };

  const handleClose = () => {
    setModalType(null);
    setSelected(null);
    setSelectedPermissions([]);
    reset({});
  };

  const onSubmit = async (data: GroupFormData) => {
    setButtonClicked(true);

    try {
      if (modalType === "add") {
        const res = await fetch(BASE_URL + "/post_group", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(data),
        });

        if (res.status === 201) {
          toast.success("Group created successfully");
          await fetchGroups();
        } else {
          const errorData = await res.json();
          toast.error(errorData.error || "Failed to create group");
        }
      } else if (modalType === "edit" && selected) {
        const res = await fetch(`${BASE_URL}/update_group/${selected.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(data),
        });

        if (res.status === 200) {
          toast.success("Group updated successfully");
          await fetchGroups();
        } else {
          const errorData = await res.json();
          toast.error(
            errorData.error || errorData.message || "Failed to update group"
          );
        }
      }
    } catch (error) {
      toast.error(
        `Couldn't ${modalType === "add" ? "create" : "update"} group`
      );
    } finally {
      setButtonClicked(false);
    }

    handleClose();
  };

  const handleSetPermissions = async () => {
    if (!selected) return;

    setButtonClicked(true);
    try {
      const res = await fetch(`${BASE_URL}/set_group_permissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          group_id: selected.id,
          permissions: selectedPermissions,
        }),
      });

      if (res.status === 200) {
        toast.success("Group permissions updated successfully");
        await fetchGroups();
        handleClose();
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "Failed to update permissions");
      }
    } catch (error) {
      toast.error("Failed to update permissions");
    } finally {
      setButtonClicked(false);
    }
  };

  const handleDelete = async () => {
    if (selected) {
      try {
        const res = await fetch(`${BASE_URL}/delete_group/${selected.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        });

        if (res.status === 200) {
          toast.success("Group deleted successfully");
        } else {
          toast.error("Failed to delete group");
        }
      } catch {
        toast.error("Failed to delete group");
      }
      await fetchGroups();
      handleClose();
    }
  };

  const getPageNumbers = () => {
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, page + 2);
    if (page <= 2) end = Math.min(5, totalPages);
    if (page >= totalPages - 1) start = Math.max(totalPages - 4, 1);
    return Array.from(
      { length: Math.max(0, end - start + 1) },
      (_, i) => start + i
    );
  };

  const getGroupBadge = (group: CustomGroup) => {
    const groupName = group.name.toLowerCase();
    if (groupName.includes("admin") || groupName.includes("super")) {
      return "bg-purple-100 text-purple-800 border-purple-200";
    } else if (groupName.includes("manager") || groupName.includes("staff")) {
      return "bg-blue-100 text-blue-800 border-blue-200";
    } else if (groupName.includes("biller")) {
      return "bg-orange-100 text-orange-800 border-orange-200";
    } else if (groupName.includes("customer")) {
      return "bg-green-100 text-green-800 border-green-200";
    }
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getUserCountBadge = (count: number) => {
    if (count === 0) return "bg-gray-100 text-gray-600 border-gray-200";
    if (count <= 5) return "bg-blue-100 text-blue-600 border-blue-200";
    if (count <= 20) return "bg-green-100 text-green-600 border-green-200";
    return "bg-purple-100 text-purple-600 border-purple-200";
  };

  const getPermissionCountBadge = (count: number) => {
    if (count === 0) return "bg-gray-100 text-gray-600 border-gray-200";
    if (count <= 5) return "bg-orange-100 text-orange-600 border-orange-200";
    if (count <= 15) return "bg-yellow-100 text-yellow-600 border-yellow-200";
    return "bg-red-100 text-red-600 border-red-200";
  };

  const groupPermissionsByApp = (permissions: Permission[]) => {
    const grouped: { [key: string]: Permission[] } = {};

    permissions.forEach((permission) => {
      const contentType = permission.content_type || "other";
      const appLabel = typeof contentType === 'string' 
        ? contentType.split("_")[0] || "other"
        : "other";
      
      if (!grouped[appLabel]) {
        grouped[appLabel] = [];
      }
      grouped[appLabel].push(permission);
    });

    return grouped;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Groups Management
                </h1>
                <p className="text-gray-600">
                  Manage user groups and their permissions
                </p>
              </div>
            </div>
            <button
              onClick={() => handleOpen("add")}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Add Group
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search groups by name..."
                  value={search}
                  onChange={(e) => {
                    setPage(1);
                    setSearch(e.target.value);
                  }}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            <div className="text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-lg">
              Page {page} of {totalPages}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Group
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Users
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Permissions
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-gray-200">
                    {groups.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-3 text-gray-500">
                            <Users className="w-12 h-12 opacity-50" />
                            <p className="text-lg">No groups found</p>
                            <p className="text-sm">
                              Get started by creating your first group
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      groups.map((group, index) => (
                        <tr
                          key={group.id}
                          className="hover:bg-gray-50 transition-colors duration-150"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {(page - 1) * 10 + index + 1}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                                <Users className="w-5 h-5 text-indigo-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {group.name}
                                </p>
                                <div className="flex gap-1 mt-1">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium border ${getGroupBadge(
                                      group
                                    )}`}
                                  >
                                    {group.name}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <UserCheck className="w-4 h-4 text-gray-400" />
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium border ${getUserCountBadge(
                                  group.user_count
                                )}`}
                              >
                                {group.user_count} users
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Key className="w-4 h-4 text-gray-400" />
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium border ${getPermissionCountBadge(
                                  group.permissions?.length || 0
                                )}`}
                              >
                                {group.permissions?.length || 0} permissions
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpen("view", group)}
                                className="p-2 text-gray-400 hover:text-indigo-600 transition-colors duration-200"
                                title="View Group"
                              >
                                <EyeIcon size={16} />
                              </button>
                              <button
                                onClick={() => handleOpen("edit", group)}
                                className="p-2 text-gray-400 hover:text-green-600 transition-colors duration-200"
                                title="Edit Group"
                              >
                                <PencilIcon size={16} />
                              </button>
                              <button
                                onClick={() => handleOpen("permissions", group)}
                                className="p-2 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                                title="Manage Permissions"
                              >
                                <Shield size={16} />
                              </button>
                              <button
                                onClick={() => handleOpen("delete", group)}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                                title="Delete Group"
                              >
                                <TrashIcon size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {groups.length > 0 && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {groups.length} groups
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={page === 1}
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
                      >
                        Previous
                      </button>

                      {getPageNumbers().map((p) => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`px-4 py-2 border rounded-lg transition-all duration-200 ${
                            p === page
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {p}
                        </button>
                      ))}

                      <button
                        disabled={page === totalPages}
                        onClick={() =>
                          setPage((prev) => Math.min(totalPages, prev + 1))
                        }
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {modalType && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      modalType === "add"
                        ? "bg-indigo-100 text-indigo-600"
                        : modalType === "edit"
                        ? "bg-green-100 text-green-600"
                        : modalType === "view"
                        ? "bg-blue-100 text-blue-600"
                        : modalType === "permissions"
                        ? "bg-purple-100 text-purple-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    <Users className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {modalType === "add"
                      ? "Create New Group"
                      : modalType === "edit"
                      ? "Edit Group"
                      : modalType === "view"
                      ? "Group Details"
                      : modalType === "permissions"
                      ? "Manage Permissions"
                      : "Delete Group"}
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              {modalType === "view" && selected && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <Users className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {selected.name}
                      </h3>
                      <div className="flex gap-2 mt-2">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium border ${getGroupBadge(
                            selected
                          )}`}
                        >
                          {selected.name}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium border ${getUserCountBadge(
                            selected.user_count
                          )}`}
                        >
                          {selected.user_count} users
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-3">
                      Group Permissions ({selected.permissions?.length || 0})
                    </label>
                    {selected.permissions && selected.permissions.length > 0 ? (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.entries(
                            groupPermissionsByApp(selected.permissions)
                          ).map(([app, appPermissions]) => (
                            <div key={app} className="space-y-2">
                              <h4 className="font-medium text-gray-900 capitalize text-sm">
                                {app}
                              </h4>
                              <div className="space-y-1">
                                {appPermissions.map((permission, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-2 text-sm text-gray-600"
                                  >
                                    <Check className="w-4 h-4 text-green-600" />
                                    <span>{permission.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                        No permissions assigned to this group
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={() => handleOpen("edit", selected)}
                      className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200"
                    >
                      Edit Group
                    </button>
                    <button
                      onClick={() => handleOpen("permissions", selected)}
                      className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors duration-200"
                    >
                      Manage Permissions
                    </button>
                    <button
                      onClick={handleClose}
                      className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-200"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {(modalType === "add" || modalType === "edit") && (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2">
                      Group Name *
                    </label>
                    <input
                      {...register("name")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter group name (e.g., Administrators, Billers, Customers)"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={button_clicked}
                    className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {button_clicked ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {modalType === "add"
                          ? "Creating Group..."
                          : "Updating Group..."}
                      </div>
                    ) : modalType === "add" ? (
                      "Create Group"
                    ) : (
                      "Update Group"
                    )}
                  </button>
                </form>
              )}

              {modalType === "permissions" && selected && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Shield className="w-8 h-8 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Manage Permissions
                      </h3>
                      <p className="text-gray-600">Group: {selected.name}</p>
                      <div className="flex gap-2 mt-2">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium border ${getUserCountBadge(
                            selected.user_count
                          )}`}
                        >
                          {selected.user_count} users affected
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-3">
                      Select Permissions ({selectedPermissions.length} selected)
                    </label>
                    <div className="max-h-96 overflow-y-auto bg-gray-50 rounded-lg p-4">
                      {availablePermissions.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.entries(
                            groupPermissionsByApp(availablePermissions)
                          ).map(([app, appPermissions]) => (
                            <div key={app} className="space-y-2">
                              <h4 className="font-medium text-gray-900 capitalize text-sm border-b pb-1">
                                {app} ({appPermissions.filter(p => isPermissionSelected(p.codename)).length}/{appPermissions.length})
                              </h4>
                              <div className="space-y-2">
                                {appPermissions.map((permission) => (
                                  <label
                                    key={permission.id}
                                    className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-white transition-colors duration-150"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isPermissionSelected(
                                        permission.codename
                                      )}
                                      onChange={() =>
                                        handlePermissionToggle(
                                          permission.codename
                                        )
                                      }
                                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <span className="text-sm font-medium text-gray-700 block truncate">
                                        {permission.name}
                                      </span>
                                      <span className="text-xs text-gray-500 block truncate">
                                        {permission.codename}
                                      </span>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No permissions available</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                      <span>
                        Total selected: {selectedPermissions.length} permissions
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const allCodenames = availablePermissions.map(p => p.codename);
                            setSelectedPermissions(allCodenames);
                          }}
                          className="text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          Select all
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedPermissions([])}
                          className="text-red-600 hover:text-red-700 font-medium"
                        >
                          Clear all
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={handleSetPermissions}
                      disabled={button_clicked}
                      className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors duration-200 disabled:opacity-50"
                    >
                      {button_clicked ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Updating Permissions...
                        </div>
                      ) : (
                        "Update Group Permissions"
                      )}
                    </button>
                    <button
                      onClick={handleClose}
                      className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {modalType === "delete" && selected && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrashIcon className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Delete Group
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete the group{" "}
                    <strong>"{selected.name}"</strong>? This action will affect{" "}
                    <strong>{selected.user_count} users</strong> in this group
                    and cannot be undone.
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={handleDelete}
                      disabled={button_clicked}
                      className="flex-1 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors duration-200 disabled:opacity-50"
                    >
                      {button_clicked ? "Deleting..." : "Yes, Delete"}
                    </button>
                    <button
                      onClick={handleClose}
                      className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}