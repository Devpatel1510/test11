import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useauthstore } from "./auth.store";



export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  subscribeToMessages: () => {
  const { selectedUser } = get();
  if (!selectedUser) return;

  const socket = useauthstore.getState().socket;
  if (!socket) {
    console.warn("Socket not initialized yet.");
    return;
  }

  const handler = (newMessage) => {
    if (
      newMessage.senderId === selectedUser._id ||
      newMessage.receiverId === selectedUser._id
    ) {
      set({ messages: [...get().messages, newMessage] });
    }
  };

  socket.on("newMessage", handler);
  set({ socketMessageHandler: handler });
},


  unsubscribeFromMessages: () => {
  const socket = useauthstore.getState().socket;
  const handler = get().socketMessageHandler;

  if (!socket) {
    console.warn("Socket not available during unsubscribe.");
    return;
  }

  if (handler) {
    socket.off("newMessage", handler);
    set({ socketMessageHandler: null });
  }
},


  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));