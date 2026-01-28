import { supabase } from '../config/supabase.js';

export const getUserNotifications = async (userId) => {
  // Get student or advisor ID from user
  const { data: student } = await supabase
    .from('students')
    .select('student_id')
    .eq('user_id', userId)
    .single();
  
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('student_id', student?.student_id)
    .order('created_at', { ascending: false });
  
  if (error) throw new Error(error.message);
  return data;
};

export const getNotificationById = async (notificationId, userId) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('notification_id', notificationId)
    .single();
  
  if (error) throw new Error(error.message);
  return data;
};

export const markNotificationAsRead = async (notificationId, userId) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('notification_id', notificationId)
    .select()
    .single();
  
  if (error) throw new Error(error.message);
  return data;
};

export const deleteNotification = async (notificationId, userId) => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('notification_id', notificationId);
  
  if (error) throw new Error(error.message);
  return { success: true };
};

export const createNotification = async (data) => {
  const { data: notification, error } = await supabase
    .from('notifications')
    .insert([data])
    .select()
    .single();
  
  if (error) throw new Error(error.message);
  return notification;
};
