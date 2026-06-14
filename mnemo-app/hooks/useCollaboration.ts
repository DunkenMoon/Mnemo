"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase, CollaboratorState, getCollabColor } from "@/lib/collaboration";

export function useCollaboration(documentId: string, currentUser: { id: string; name: string }) {
  const [collaborators, setCollaborators] = useState<Map<string, CollaboratorState>>(new Map());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  
  // Randomly assign color to current user ONCE
  const myColor = useRef(getCollabColor(Math.floor(Math.random() * 5)));

  useEffect(() => {
    if (!currentUser.id || currentUser.id === "anonymous") return;

    const channel = supabase.channel(`universe:${documentId}`, {
      config: { presence: { key: currentUser.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<CollaboratorState>();
        const map = new Map<string, CollaboratorState>();
        Object.values(state).flat().forEach((user) => {
          if (user.userId !== currentUser.id) map.set(user.userId, user);
        });
        setCollaborators(map);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            userId: currentUser.id,
            userName: currentUser.name,
            avatarColor: myColor.current,
            selectedNodeId: null,
            lastSeen: Date.now(),
          } satisfies CollaboratorState);
        }
      });

    channelRef.current = channel;
    
    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [documentId, currentUser.id, currentUser.name]);

  const broadcastNodeSelection = useCallback(async (nodeId: string | null) => {
    if (channelRef.current?.state === "joined") {
      await channelRef.current.track({
        userId: currentUser.id,
        userName: currentUser.name,
        avatarColor: myColor.current,
        selectedNodeId: nodeId,
        lastSeen: Date.now(),
      });
    }
  }, [currentUser.id, currentUser.name]);

  return { collaborators, myColor: myColor.current, broadcastNodeSelection };
}
