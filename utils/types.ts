interface ChatRoom {
  $id: string;
  title: string;
  description: string;
  $createdAt: string;
  $updatedAt: string;
  $permissions: any[];
  $databaseId: string;
  $collectionId: string;
}
interface Message {
  $id?: string;
  $createdAt?: string;
  $updatedAt?: string;
  $collectionId?: string;
  $databaseId?: string;
  $permissions?: any[];
  content: string;
  senderId: string;
  senderName: string;
  senderPhoto: string;
  chatRoomId: string;
}

interface User {
  id: string;
  fullName: string;
  email: string;
}

export type { ChatRoom, Message, User };