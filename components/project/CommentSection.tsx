"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { Comment } from "@/types";

interface CommentSectionProps {
  projectId: string;
}

export default function CommentSection({ projectId }: CommentSectionProps) {
  const { isLoggedIn, user } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await api.get(`/projects/${projectId}/comments`);
        setComments(res.data.comments);
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [projectId]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    try {
      setSubmitting(true);
      const res = await api.post(`/projects/${projectId}/comments`, {
        content: newComment,
      });
      setComments((prev) => [res.data.comment, ...prev]);
      setNewComment("");
      toast.success("Comment posted");
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">
        Comments {comments.length > 0 && `(${comments.length})`}
      </h2>

      {/* New Comment */}
      {isLoggedIn ? (
        <div className="flex gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={user?.avatar ?? ""} />
            <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={submitting || !newComment.trim()}
            >
              {submitting ? "Posting..." : "Post Comment"}
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          <a href="/login" className="text-primary hover:underline">Sign in</a> to leave a comment
        </p>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No comments yet. Be the first!
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              projectId={projectId}
              onReplyAdded={(reply, parentId) => {
                setComments((prev) =>
                  prev.map((c) =>
                    c.id === parentId
                      ? { ...c, replies: [...(c.replies ?? []), reply] }
                      : c
                  )
                );
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  projectId: string;
  onReplyAdded: (reply: Comment, parentId: string) => void;
  isReply?: boolean;
}

function CommentItem({ comment, projectId, onReplyAdded, isReply = false }: CommentItemProps) {
  const { isLoggedIn, user } = useAuthStore();
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    try {
      setSubmitting(true);
      const res = await api.post(`/projects/${projectId}/comments`, {
        content: replyText,
        parentId: comment.id,
      });
      onReplyAdded(res.data.comment, comment.id);
      setReplyText("");
      setShowReply(false);
      toast.success("Reply posted");
    } catch {
      toast.error("Failed to post reply");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`flex gap-3 ${isReply ? "ml-10" : ""}`}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={comment.user.avatar ?? ""} />
        <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{comment.user.name}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm leading-relaxed">{comment.content}</p>

        {/* Reply button */}
        {isLoggedIn && !isReply && (
          <button
            onClick={() => setShowReply(!showReply)}
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            {showReply ? "Cancel" : "Reply"}
          </button>
        )}

        {/* Reply input */}
        {showReply && (
          <div className="space-y-2 mt-2">
            <Textarea
              placeholder={`Reply to ${comment.user.name}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={2}
            />
            <Button
              size="sm"
              onClick={handleReply}
              disabled={submitting || !replyText.trim()}
            >
              {submitting ? "Posting..." : "Reply"}
            </Button>
          </div>
        )}

        {/* Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-3 mt-3">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                projectId={projectId}
                onReplyAdded={onReplyAdded}
                isReply
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}