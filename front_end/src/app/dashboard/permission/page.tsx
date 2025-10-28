"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getAuthToken } from "@/app/auth/login/api";
import { toast } from "react-toastify";
import { EyeIcon, PencilIcon, TrashIcon, Plus, Shield, Key, Search, Check, X, Lock, Unlock, Filter, Copy } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const permissionSchema = z.object({
  name: z.string().min(1, "Permission name is required"),
  codename: z.string().min(1, "Codename is required"),
  content_type: z.number().min(1, "Content type is required"),
});

type PermissionFormData = z.infer<typeof permissionSchema>;

type Permission = {
  id: number;
  name: string;
  codename: string;
  content_type: number;
  content_type_name?: string;
};

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Permission | null>(null);
  const [modalType, setModalType] = useState<"add" | "edit" | "view" | "delete" | null>(null);
  const [button_clicked, setButtonClicked] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [contentTypes, setContentTypes] = useState<{id: number, name: string}[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 1000);
    return () => clearTimeout(t);
  }, [search]);

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const url = `${BASE_URL}/get_permissions?page=${page}&search=${encodeURIComponent(debouncedSearch)}`;
      
      const res = await fetch(url, {
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${getAuthToken()}` 
        },
      });
      const data = await res.json();
      if (res.status === 200) {
        setPermissions(data.data || data.results || []);
        setTotalPages(data.total_pages || 1);
      } else {
        toast.error(data.error || "Failed to load permissions");
      }
    } catch {
      toast.error("Couldn't fetch permissions");
    } finally {
      setLoading(false);
    }
  };

  const fetchContentTypes = async () => {
    try {
      const res = await fetch(`${BASE_URL}/content-types/`, {
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${getAuthToken()}` 
        },
      });
      const data = await res.json();
      if (res.status === 200) {
        setContentTypes(data.data || data.results || []);
      }
    } catch {
      console.error("Failed to fetch content types");
    }
  };

  useEffect(() => { 
    fetchPermissions();
    fetchContentTypes();
  }, [page, debouncedSearch]);

  const { 
    register, 
    handleSubmit, 
    reset, 
    formState: { errors },
    setValue,
    watch
  } = useForm<PermissionFormData>({
    resolver: zodResolver(permissionSchema),
  });

  const handleOpen = async (type: typeof modalType, permission?: Permission) => {
    setModalType(type);
    setSelected(permission || null);
    
    if (permission) {
      reset({
        name: permission.name,
        codename: permission.codename,
        content_type: permission.content_type,
      });
    } else {
      reset({
        name: "",
        codename: "",
        content_type: 0,
      });
    }
  };

  const handleClose = () => { 
    setModalType(null); 
    setSelected(null); 
    reset({}); 
  };

  // Generate codename from name
  const generateCodename = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/(^_|_$)/g, '');
  };

  // Auto-generate codename when name changes
  const nameValue = watch("name");
  useEffect(() => {
    if (modalType === "add" && nameValue) {
      const generatedCodename = generateCodename(nameValue);
      setValue("codename", generatedCodename);
    }
  }, [nameValue, modalType, setValue]);

  const onSubmit = async (data: PermissionFormData) => {
    setButtonClicked(true);
    
    try {
      if (modalType === "add") {
        const res = await fetch(BASE_URL + "/permissions/", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}` 
          },
          body: JSON.stringify(data),
        });
        
        if (res.status === 201) {
          toast.success("Permission created successfully");
        } else {
          const errorData = await res.json();
          toast.error(errorData.error || "Failed to create permission");
        }
      } else if (modalType === "edit" && selected) {
        const res = await fetch(`${BASE_URL}/permissions/${selected.id}/`, {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}` 
          },
          body: JSON.stringify(data),
        });
        
        if (res.status === 200) {
          toast.success("Permission updated successfully");
        } else {
          const errorData = await res.json();
          toast.error(errorData.error || "Failed to update permission");
        }
      }
    } catch {
      toast.error(`Couldn't ${modalType === "add" ? "create" : "update"} permission`);
    } finally { 
      setButtonClicked(false); 
    }
    
    await fetchPermissions();
    handleClose();
  };

  const handleDelete = async () => {
    if (selected) {
      try {
        const res = await fetch(`${BASE_URL}/permissions/${selected.id}/`, { 
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        });
        
        if (res.status === 200) {
          toast.success("Permission deleted successfully");
        } else {
          const errorData = await res.json();
          toast.error(errorData.error || "Failed to delete permission");
        }
      } catch {
        toast.error("Failed to delete permission");
      }
      await fetchPermissions();
      handleClose();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const getPageNumbers = () => {
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, page + 2);
    if (page <= 2) end = Math.min(5, totalPages);
    if (page >= totalPages - 1) start = Math.max(totalPages - 4, 1);
    return Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);
  };

  const getContentTypeName = (contentTypeId: number) => {
    const contentType = contentTypes.find(ct => ct.id === contentTypeId);
    return contentType?.name || `Type ${contentTypeId}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Permissions Management</h1>
                <p className="text-gray-600">Manage system permissions and access controls</p>
              </div>
            </div>
            <button 
              onClick={() => handleOpen("add")}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Add Permission
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
                  placeholder="Search permissions by name or codename..." 
                  value={search} 
                  onChange={(e) => { 
                    setPage(1); 
                    setSearch(e.target.value); 
                  }} 
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th>#</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Permission Name</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Codename</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Content Type</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-gray-200">
                    {permissions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-3 text-gray-500">
                            <Shield className="w-12 h-12 opacity-50" />
                            <p className="text-lg">No permissions found</p>
                            <p className="text-sm">Get started by creating your first permission</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      permissions.map((permission,index) => (
                        <tr key={permission.id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {(page - 1) * 10 + index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <Key className="w-5 h-5 text-purple-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {permission.name}
                                </p>
                                <p className="text-xs text-gray-500">ID: {permission.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2 group">
                              <code className="text-sm bg-gray-100 px-2 py-1 rounded-md font-mono">
                                {permission.codename}
                              </code>
                              <button
                                onClick={() => copyToClipboard(permission.codename)}
                                className="p-1 text-gray-400 hover:text-purple-600 transition-colors duration-200 opacity-0 group-hover:opacity-100"
                                title="Copy codename"
                              >
                                <Copy size={14} />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {getContentTypeName(permission.content_type)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpen("view", permission)}
                                className="p-2 text-gray-400 hover:text-purple-600 transition-colors duration-200"
                                title="View Permission"
                              >
                                <EyeIcon size={16} />
                              </button>
                              <button
                                onClick={() => handleOpen("edit", permission)}
                                className="p-2 text-gray-400 hover:text-green-600 transition-colors duration-200"
                                title="Edit Permission"
                              >
                                <PencilIcon size={16} />
                              </button>
                              <button
                                onClick={() => handleOpen("delete", permission)}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                                title="Delete Permission"
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

              {permissions.length > 0 && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {permissions.length} permissions
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
                        onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
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

      {/* Modal with transparent background */}
      {modalType && (
        <div className="fixed inset-0 bg-black/30  flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    modalType === 'add' ? 'bg-purple-100 text-purple-600' :
                    modalType === 'edit' ? 'bg-green-100 text-green-600' :
                    modalType === 'view' ? 'bg-blue-100 text-blue-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    <Shield className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {modalType === "add" ? "Create New Permission" :
                     modalType === "edit" ? "Edit Permission" :
                     modalType === "view" ? "Permission Details" : "Delete Permission"}
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              {/* View Modal */}
              {modalType === "view" && selected && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Permission Information</label>
                        <div className="mt-4 space-y-4 bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Name:</span>
                            <span className="text-gray-900">{selected.name}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Codename:</span>
                            <div className="flex items-center gap-2">
                              <code className="text-sm bg-white px-2 py-1 rounded-md font-mono">
                                {selected.codename}
                              </code>
                              <button
                                onClick={() => copyToClipboard(selected.codename)}
                                className="p-1 text-gray-400 hover:text-purple-600 transition-colors duration-200"
                                title="Copy codename"
                              >
                                <Copy size={14} />
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Content Type:</span>
                            <span className="text-gray-900">{getContentTypeName(selected.content_type)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">ID:</span>
                            <span className="text-gray-900">{selected.id}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={() => handleOpen("edit", selected)}
                      className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors duration-200"
                    >
                      Edit Permission
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

              {/* Add/Edit Modal */}
              {(modalType === "add" || modalType === "edit") && (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Shield className="w-4 h-4" />
                      Permission Name *
                    </label>
                    <input
                      {...register("name")}
                      placeholder="Enter permission name (e.g., Can view user)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Key className="w-4 h-4" />
                      Codename *
                    </label>
                    <input
                      {...register("codename")}
                      placeholder="Enter codename (e.g., view_user)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 font-mono"
                    />
                    {errors.codename && (
                      <p className="text-red-500 text-sm mt-1">{errors.codename.message}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Auto-generated from name. Use lowercase with underscores.
                    </p>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Filter className="w-4 h-4" />
                      Content Type *
                    </label>
                    <select
                      {...register("content_type", { valueAsNumber: true })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value={0}>Select content type</option>
                      {contentTypes.map((ct) => (
                        <option key={ct.id} value={ct.id}>
                          {ct.name}
                        </option>
                      ))}
                    </select>
                    {errors.content_type && (
                      <p className="text-red-500 text-sm mt-1">{errors.content_type.message}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={button_clicked}
                    className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {button_clicked ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {modalType === "add" ? "Creating Permission..." : "Updating Permission..."}
                      </div>
                    ) : (
                      modalType === "add" ? "Create Permission" : "Update Permission"
                    )}
                  </button>
                </form>
              )}

              {/* Delete Modal */}
              {modalType === "delete" && selected && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrashIcon className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Permission</h3>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete the permission <strong>{selected.name}</strong>?
                    This action cannot be undone and may affect user access controls.
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