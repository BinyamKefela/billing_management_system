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
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Search,
  Filter,
  Camera,
  Check,
  X,
} from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const groupSchema = z.object({
  id: z.number(),
  name: z.string(),
});

const permissionSchema = z.object({
  id: z.number(),
  codename: z.string(),
  name: z.string(),
});

const userSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional()
    .or(z.literal("")),
  first_name: z.string().optional(),
  middle_name: z.string().optional(),
  last_name: z.string().optional(),
  phone_number: z.string().optional(),
  address: z.string().optional(),
  profile_picture: z.any().optional(),
  is_active: z.boolean(),
  is_superuser: z.boolean(),
  groups: z.array(z.string()).default([]),
  user_permissions: z.array(z.string()).default([]),
});

type UserFormData = z.infer<typeof userSchema>;
type Group = z.infer<typeof groupSchema>;
type Permission = z.infer<typeof permissionSchema>;

type CustomUser = {
  id: number;
  email: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  phone_number?: string;
  address?: string;
  profile_picture?: string;
  date_joined: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  is_biller: boolean;
  is_customer: boolean;
  last_login?: string;
  groups: string[];
  user_permissions: string[];
};

export default function UsersPage() {
  const [users, setUsers] = useState<CustomUser[]>([]);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<
    Permission[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CustomUser | null>(null);
  const [modalType, setModalType] = useState<
    "add" | "edit" | "view" | "delete" | null
  >(null);
  const [button_clicked, setButtonClicked] = useState(false);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 1000);
    return () => clearTimeout(t);
  }, [search]);

  const fetchGroups = async () => {
    try {
      const res = await fetch(`${BASE_URL}/get_groups`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableGroups(data.data || data.results || []);
      } else {
        setAvailableGroups([
          { id: 1, name: "Biller" },
          { id: 2, name: "Customer" },
          { id: 3, name: "Staff" },
        ]);
      }
    } catch (error) {
      setAvailableGroups([
        { id: 1, name: "Biller" },
        { id: 2, name: "Customer" },
        { id: 3, name: "Staff" },
      ]);
    }
  };

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

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let url = `${BASE_URL}/get_users?page=${page}&search=${encodeURIComponent(
        debouncedSearch
      )}`;
      if (roleFilter !== "all") {
        if (roleFilter === "Biller") {
          url += `&is_biller=true`;
        } else if (roleFilter === "Customer") {
          url += `&is_customer=true`;
        } else if (roleFilter === "Staff") {
          url += `&is_staff=true`;
        } else if (roleFilter === "Superuser") {
          url += `&is_superuser=true`;
        }
      }
      if (statusFilter === "active") {
        url += `&is_active=true`;
      } else if (statusFilter === "inactive") {
        url += `&is_active=false`;
      }

      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      const data = await res.json();
      if (res.status === 200) {
        setUsers(data.data || []);
        setTotalPages(data.total_pages || 1);
      } else {
        toast.error(data.error || "Failed to load users");
      }
    } catch {
      toast.error("Couldn't fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchGroups();
    fetchPermissions();
  }, [page, debouncedSearch, roleFilter, statusFilter]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
    setValue,
    getValues,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema) as any,
    defaultValues: {
      is_active: true,
      is_superuser: false,
      groups: [],
      user_permissions: [],
    },
  });

  const formValues = watch();

  const handleGroupToggle = (groupName: string) => {
    const newGroups = selectedGroups.includes(groupName)
      ? selectedGroups.filter((name) => name !== groupName)
      : [...selectedGroups, groupName];

    setSelectedGroups(newGroups);
    setValue("groups", newGroups);
  };

  const handlePermissionToggle = (permissionCodename: string) => {
    const newPermissions = selectedPermissions.includes(permissionCodename)
      ? selectedPermissions.filter(
          (codename) => codename !== permissionCodename
        )
      : [...selectedPermissions, permissionCodename];

    setSelectedPermissions(newPermissions);
    setValue("user_permissions", newPermissions);
  };

  const isGroupSelected = (groupName: string) => {
    return selectedGroups.includes(groupName);
  };

  const isPermissionSelected = (permissionCodename: string) => {
    return selectedPermissions.includes(permissionCodename);
  };

  const handleOpen = (type: typeof modalType, user?: CustomUser) => {
    setModalType(type);
    setSelected(user || null);
    setProfilePreview(null);

    if (user) {
      const userGroupNames = user.groups || [];
      const userPermissionCodenames = user.user_permissions || [];

      console.log("User groups from API:", userGroupNames);
      console.log("User permissions from API:", userPermissionCodenames);

      setSelectedGroups(userGroupNames);
      setSelectedPermissions(userPermissionCodenames);

      reset({
        email: user.email,
        first_name: user.first_name || "",
        middle_name: user.middle_name || "",
        last_name: user.last_name || "",
        phone_number: user.phone_number || "",
        address: user.address || "",
        is_active: user.is_active,
        is_superuser: user.is_superuser,
        groups: userGroupNames,
        user_permissions: userPermissionCodenames,
        password: "",
      });
      if (user.profile_picture) {
        setProfilePreview(user.profile_picture);
      }
    } else {
      setSelectedGroups([]);
      setSelectedPermissions([]);
      reset({
        is_active: true,
        is_superuser: false,
        groups: [],
        user_permissions: [],
      });
    }
  };

  const handleClose = () => {
    setModalType(null);
    setSelected(null);
    setProfilePreview(null);
    setSelectedGroups([]);
    setSelectedPermissions([]);
    reset({});
  };

  const handleProfilePictureChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue("profile_picture", file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProfilePicture = () => {
    setValue("profile_picture", null);
    setProfilePreview(null);
  };

  const onSubmit = async (data: UserFormData) => {
    setButtonClicked(true);

    try {
      if (modalType === "add") {
        const formData = new FormData();

        Object.keys(data).forEach((key) => {
          const value = data[key as keyof UserFormData];
          if (key === "profile_picture" && value) {
            formData.append(key, value as File);
          } else if (key === "groups" && Array.isArray(value)) {
            value.forEach((group) => formData.append("groups", group));
          } else if (key === "user_permissions" && Array.isArray(value)) {
            value.forEach((permission) =>
              formData.append("user_permissions", permission)
            );
          } else if (value !== undefined && value !== null && value !== "") {
            if (typeof value === "boolean") {
              formData.append(key, value.toString());
            } else {
              formData.append(key, value as string);
            }
          }
        });

        const res = await fetch(BASE_URL + "/post_user", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: formData,
        });

        if (res.status === 201) {
          toast.success("User created successfully");
          await fetchUsers();
        } else {
          const errorData = await res.json();
          toast.error(errorData.error || "Failed to create user");
        }
      } else if (modalType === "edit" && selected) {
        const updateData: any = {
          email: data.email,
          first_name: data.first_name || "",
          middle_name: data.middle_name || "",
          last_name: data.last_name || "",
          phone_number: data.phone_number || "",
          address: data.address || "",
          is_active: data.is_active,
          is_superuser: data.is_superuser,
          groups: selectedGroups,
          user_permissions: selectedPermissions,
        };

        if (data.password) {
          updateData.password = data.password;
        }

        let res: Response;

        if (data.profile_picture) {
          const formData = new FormData();

          Object.keys(updateData).forEach((key) => {
            const value = updateData[key];
            if (Array.isArray(value)) {
              value.forEach((item) => formData.append(key, item));
            } else if (typeof value === "boolean") {
              formData.append(key, value.toString());
            } else {
              formData.append(key, value);
            }
          });

          formData.append("profile_picture", data.profile_picture);

          res = await fetch(`${BASE_URL}/update_user/${selected.id}`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${getAuthToken()}`,
            },
            body: formData,
          });
        } else {
          res = await fetch(`${BASE_URL}/update_user/${selected.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getAuthToken()}`,
            },
            body: JSON.stringify(updateData),
          });
        }

        if (res.status === 200) {
          toast.success("User updated successfully");
          await fetchUsers();
        } else {
          const errorData = await res.json();
          toast.error(
            errorData.error || errorData.message || "Failed to update user"
          );
        }
      }
    } catch (error) {
      toast.error(`Couldn't ${modalType === "add" ? "create" : "update"} user`);
    } finally {
      setButtonClicked(false);
    }

    handleClose();
  };

  const handleDelete = async () => {
    if (selected) {
      try {
        const res = await fetch(`${BASE_URL}/deactivate_user/${selected.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        });

        if (res.status === 200) {
          toast.success("User deactivated successfully");
        } else {
          toast.error("Failed to deactivate user");
        }
      } catch {
        toast.error("Failed to deactivate user");
      }
      await fetchUsers();
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

  const getStatusBadge = (isActive: boolean) => {
    return isActive
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-red-100 text-red-800 border-red-200";
  };

  const getRoleBadge = (user: CustomUser) => {
    if (user.is_superuser)
      return "bg-purple-100 text-purple-800 border-purple-200";
    if (user.is_staff) return "bg-blue-100 text-blue-800 border-blue-200";
    if (user.is_biller)
      return "bg-orange-100 text-orange-800 border-orange-200";
    if (user.is_customer) return "bg-green-100 text-green-800 border-green-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getUserRole = (user: CustomUser) => {
    if (user.is_superuser) return "Superuser";
    if (user.is_staff) return "Staff";
    if (user.is_biller) return "Biller";
    if (user.is_customer) return "Customer";
    return "User";
  };

  const getUserInitials = (user: CustomUser) => {
    const first = user.first_name?.[0] || "";
    const last = user.last_name?.[0] || "";
    return (first + last).toUpperCase() || user.email[0].toUpperCase();
  };

  const getDisplayName = (user: CustomUser) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.email;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-xl">
                <User className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Users Management
                </h1>
                <p className="text-gray-600">
                  Manage system users and their permissions
                </p>
              </div>
            </div>
            <button
              onClick={() => handleOpen("add")}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Add User
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
                  placeholder="Search users by name, email, or phone..."
                  value={search}
                  onChange={(e) => {
                    setPage(1);
                    setSearch(e.target.value);
                  }}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <select
                    value={roleFilter}
                    onChange={(e) => {
                      setPage(1);
                      setRoleFilter(e.target.value);
                    }}
                    className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="all">All Roles</option>
                    <option value="Biller">Biller</option>
                    <option value="Customer">Customer</option>
                  </select>
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setPage(1);
                    setStatusFilter(e.target.value);
                  }}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th>#</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-3 text-gray-500">
                            <User className="w-12 h-12 opacity-50" />
                            <p className="text-lg">No users found</p>
                            <p className="text-sm">
                              Get started by creating your first user
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      users.map((user,index) => (
                        <tr
                          key={user.id}
                          className="hover:bg-gray-50 transition-colors duration-150"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {(page - 1) * 10 + index + 1}{" "}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {user.profile_picture ? (
                                <img
                                  src={user.profile_picture}
                                  alt={getDisplayName(user)}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                  <span className="text-purple-600 font-semibold text-sm">
                                    {getUserInitials(user)}
                                  </span>
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {getDisplayName(user)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              {user.phone_number && (
                                <div className="flex items-center gap-2 text-sm text-gray-900">
                                  <Phone className="w-4 h-4 text-gray-400" />
                                  {user.phone_number}
                                </div>
                              )}
                              {user.address && (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <MapPin className="w-4 h-4 text-gray-400" />
                                  <span className="truncate max-w-xs">
                                    {user.address}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadge(
                                user
                              )}`}
                            >
                              {getUserRole(user)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(
                                user.is_active
                              )}`}
                            >
                              {user.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {new Date(user.date_joined).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpen("view", user)}
                                className="p-2 text-gray-400 hover:text-purple-600 transition-colors duration-200"
                                title="View User"
                              >
                                <EyeIcon size={16} />
                              </button>
                              <button
                                onClick={() => handleOpen("edit", user)}
                                className="p-2 text-gray-400 hover:text-green-600 transition-colors duration-200"
                                title="Edit User"
                              >
                                <PencilIcon size={16} />
                              </button>
                              <button
                                onClick={() => handleOpen("delete", user)}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                                title="Delete User"
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

              {users.length > 0 && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {users.length} users
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
                              ? "bg-purple-600 text-white border-purple-600"
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
        <div className="fixed inset-0 bg-black/30  flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      modalType === "add"
                        ? "bg-purple-100 text-purple-600"
                        : modalType === "edit"
                        ? "bg-green-100 text-green-600"
                        : modalType === "view"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    <User className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {modalType === "add"
                      ? "Create New User"
                      : modalType === "edit"
                      ? "Edit User"
                      : modalType === "view"
                      ? "User Details"
                      : "Delete User"}
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
                    {selected.profile_picture ? (
                      <img
                        src={selected.profile_picture}
                        alt={getDisplayName(selected)}
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-semibold text-2xl">
                          {getUserInitials(selected)}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {getDisplayName(selected)}
                      </h3>
                      <p className="text-gray-600">{selected.email}</p>
                      <div className="flex gap-2 mt-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadge(
                            selected
                          )}`}
                        >
                          {getUserRole(selected)}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(
                            selected.is_active
                          )}`}
                        >
                          {selected.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Personal Information
                        </label>
                        <div className="mt-2 space-y-2">
                          {selected.first_name && (
                            <p>
                              <span className="font-medium">First Name:</span>{" "}
                              {selected.first_name}
                            </p>
                          )}
                          {selected.middle_name && (
                            <p>
                              <span className="font-medium">Middle Name:</span>{" "}
                              {selected.middle_name}
                            </p>
                          )}
                          {selected.last_name && (
                            <p>
                              <span className="font-medium">Last Name:</span>{" "}
                              {selected.last_name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Contact Information
                        </label>
                        <div className="mt-2 space-y-2">
                          {selected.phone_number && (
                            <p>
                              <span className="font-medium">Phone:</span>{" "}
                              {selected.phone_number}
                            </p>
                          )}
                          {selected.address && (
                            <p>
                              <span className="font-medium">Address:</span>{" "}
                              {selected.address}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Account Information
                        </label>
                        <div className="mt-2 space-y-2">
                          <p>
                            <span className="font-medium">Joined:</span>{" "}
                            {new Date(
                              selected.date_joined
                            ).toLocaleDateString()}
                          </p>
                          {selected.last_login && (
                            <p>
                              <span className="font-medium">Last Login:</span>{" "}
                              {new Date(
                                selected.last_login
                              ).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Groups
                        </label>
                        <div className="mt-2 space-y-1">
                          {selected.groups?.map((group, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2"
                            >
                              <Check className="w-4 h-4 text-green-600" />
                              <span>{group}</span>
                            </div>
                          ))}
                          {(!selected.groups ||
                            selected.groups.length === 0) && (
                            <p className="text-gray-500">No groups assigned</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Permissions
                        </label>
                        <div className="mt-2 space-y-1">
                          {selected.user_permissions?.map(
                            (permission, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2"
                              >
                                <Check className="w-4 h-4 text-green-600" />
                                <span>{permission}</span>
                              </div>
                            )
                          )}
                          {(!selected.user_permissions ||
                            selected.user_permissions.length === 0) && (
                            <p className="text-gray-500">
                              No permissions assigned
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={() => handleOpen("edit", selected)}
                      className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors duration-200"
                    >
                      Edit User
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
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      {profilePreview ? (
                        <div className="relative">
                          <img
                            src={profilePreview}
                            alt="Profile preview"
                            className="w-20 h-20 rounded-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={removeProfilePicture}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-200"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {getDisplayName(
                            selected ||
                              ({
                                email: "",
                                first_name: "",
                                last_name: "",
                              } as CustomUser)
                          )}
                        </h3>
                        <p className="text-gray-600">
                          {selected?.email || "New user"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Profile Picture
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePictureChange}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Mail className="w-4 h-4" />
                        Email Address *
                      </label>
                      <input
                        {...register("email")}
                        type="email"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    {(modalType === "add" ||
                      (modalType === "edit" && formValues.password)) && (
                      <div className="md:col-span-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <Shield className="w-4 h-4" />
                          Password{" "}
                          {modalType === "add"
                            ? "*"
                            : "(leave blank to keep current)"}
                        </label>
                        <input
                          {...register("password")}
                          type="password"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        />
                        {errors.password && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.password.message}
                          </p>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        {...register("first_name")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2">
                        Middle Name
                      </label>
                      <input
                        {...register("middle_name")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        {...register("last_name")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Phone className="w-4 h-4" />
                        Phone Number
                      </label>
                      <input
                        {...register("phone_number")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <MapPin className="w-4 h-4" />
                        Address
                      </label>
                      <input
                        {...register("address")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register("is_active")}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Active User
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register("is_superuser")}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Superuser
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-3">
                      User Groups
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                      {availableGroups.map((group) => (
                        <label
                          key={group.id}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isGroupSelected(group.name)}
                            onChange={() => handleGroupToggle(group.name)}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            {group.name}
                          </span>
                        </label>
                      ))}
                      {availableGroups.length === 0 && (
                        <div className="col-span-2 text-center text-gray-500 py-2">
                          No groups available
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-3">
                      User Permissions
                    </label>
                    <div className="max-h-60 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                      {availablePermissions.map((permission) => (
                        <label
                          key={permission.id}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isPermissionSelected(permission.codename)}
                            onChange={() =>
                              handlePermissionToggle(permission.codename)
                            }
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            {permission.name}
                          </span>
                        </label>
                      ))}
                      {availablePermissions.length === 0 && (
                        <div className="col-span-2 text-center text-gray-500 py-2">
                          No permissions available
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={button_clicked}
                    className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {button_clicked ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {modalType === "add"
                          ? "Creating User..."
                          : "Updating User..."}
                      </div>
                    ) : modalType === "add" ? (
                      "Create User"
                    ) : (
                      "Update User"
                    )}
                  </button>
                </form>
              )}

              {modalType === "delete" && selected && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrashIcon className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Delete User
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete user{" "}
                    <strong>{getDisplayName(selected)}</strong> (
                    {selected.email})? This action cannot be undone and will
                    permanently remove all associated data.
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
