import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { User, UserInput } from "@/schemas/user-schema";

export function useUsers() {
  return useQuery<User[], Error>({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation<User, Error, UserInput>({
    mutationFn: async (newUser) => {
      const response = await fetch("/api/sign_up", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzU2MjIwNDcwLCJpYXQiOjE3NTYxMzQwNzAsImp0aSI6ImZlYjBmYzE4YTU1NTQ2YzA4Y2NhNGQxZjA0YjY5ZGZlIiwidXNlcl9pZCI6MX0.cJkHxvez_N2ZomwIjLVvybDHRgAY8nKxiezGJ5USBwE"
        },
        body: JSON.stringify(newUser),
      });
      if (!response.ok) {
        console.log(response.statusText);
        throw new Error("Network response was not ok");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation<User, Error, { userId: number; updatedUser: Partial<UserInput> }>({
    mutationFn: async ({ userId, updatedUser }) => {
      const response = await fetch(`/api/update_users/${userId}`, {
        method: "PUT",
        headers: {
            "content-type":"application/json",
          "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzU2MjIwNDcwLCJpYXQiOjE3NTYxMzQwNzAsImp0aSI6ImZlYjBmYzE4YTU1NTQ2YzA4Y2NhNGQxZjA0YjY5ZGZlIiwidXNlcl9pZCI6MX0.cJkHxvez_N2ZomwIjLVvybDHRgAY8nKxiezGJ5USBwE"
        },
        body: JSON.stringify(updatedUser),
      });
      if (!response.ok) {
        console.log(response.statusText)
        throw new Error("Network response was not ok");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (userId) => {
      const response = await fetch(`/api/delete_users/${userId}`, {
        method: "DELETE",
        headers: {
            "content-type":"application/json",
          "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzU2MjIwNDcwLCJpYXQiOjE3NTYxMzQwNzAsImp0aSI6ImZlYjBmYzE4YTU1NTQ2YzA4Y2NhNGQxZjA0YjY5ZGZlIiwidXNlcl9pZCI6MX0.cJkHxvez_N2ZomwIjLVvybDHRgAY8nKxiezGJ5USBwE"
        },
      });
      if (!response.ok) {
        console.log(response.statusText)
        throw new Error("Network response was not ok");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}