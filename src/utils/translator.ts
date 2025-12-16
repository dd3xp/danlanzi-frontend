import { TFunction } from 'i18next';

export interface BackendMessageResponse {
  status: 'error' | 'success';
  message: string;
  error?: string;
  errors?: any[];
  help?: string;
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  user?: T;
  token?: string;
  error?: string;
  errors?: any[];
  help?: string;
}

export function translateBackendMessage(
  messageResponse: BackendMessageResponse | ApiResponse | string,
  t: TFunction
): string {
  const message = typeof messageResponse === 'string' ? messageResponse : messageResponse.message;

  const messageMap: Record<string, string> = {
    // 通用错误
    'SERVER_RESPONSE_ERROR': 'common.errors.serverResponseError',
    'Network Error': 'common.errors.networkError',
    
    // 认证相关消息
    'Invalid email or password': 'auth.errors.invalidCredentials',
    'Invalid student ID or password': 'auth.errors.invalidCredentials',
    'Student ID not found': 'forgotPassword.errors.studentIdNotFound',
    'Security email not set': 'forgotPassword.errors.securityEmailNotSet',
    'User not found or security email mismatch': 'forgotPassword.errors.userNotFound',
    'Password must be at least 6 characters': 'forgotPassword.errors.passwordMinLength',
    'All fields are required': 'forgotPassword.errors.allFieldsRequired',
    'Student ID is required': 'forgotPassword.errors.studentIdRequired',
    'Password reset successfully': 'forgotPassword.success.resetSuccessful',
    'Failed to reset password': 'forgotPassword.errors.resetFailed',
    'Failed to get security email': 'forgotPassword.errors.getSecurityEmailFailed',
    'Registration failed': 'auth.errors.registrationFailed',
    'Login failed': 'auth.errors.loginFailed',
    'Email already registered': 'auth.errors.emailAlreadyRegistered',
    'Registration successful': 'auth.success.registrationSuccessful',
    'Login successful': 'auth.success.loginSuccessful',
    
    // 验证码相关消息
    'Invalid or expired verification code': 'verification.errors.invalidOrExpired',
    'Verification code sent successfully': 'verification.success.sent',
    'Verification code verified successfully': 'verification.success.verified',
    'Failed to send verification code': 'verification.errors.sendFailed',
    'Failed to verify verification code': 'verification.errors.verifyFailed',
    
    // 邮件相关消息
    'Email sent successfully': 'email.success.sent',
    'Failed to send email': 'email.errors.sendFailed',
    'Gmail email service not configured, please check EMAIL_USER and EMAIL_PASS environment variables': 'email.errors.notConfigured',
    'Gmail configuration incomplete': 'email.errors.configIncomplete',
    'Gmail configuration correct, connection test successful': 'email.success.configCorrect',
    'Gmail connection test failed': 'email.errors.connectionFailed',
    
    // 参数验证错误
    'Parameter validation failed': 'validation.errors.parameterValidationFailed',
    'Invalid email format': 'validation.errors.invalidEmailFormat',
    'Email subject cannot be empty': 'validation.errors.emailSubjectRequired',
    'Email text content cannot be empty': 'validation.errors.emailContentRequired',
    'Email content cannot be empty': 'validation.errors.emailContentRequired',
    'Invalid verification code type': 'validation.errors.invalidVerificationCodeType',
    
    // 数据库和系统错误
    'Database connection failed': 'system.errors.databaseConnectionFailed',
    'Internal server error': 'system.errors.internalServerError',
    'Service temporarily unavailable': 'system.errors.serviceUnavailable',
    
    // 用户相关错误
    'User already exists': 'user.errors.alreadyExists',
    'User not found': 'user.errors.notFound',
    'Account is disabled': 'user.errors.accountDisabled',
    'Account is locked': 'user.errors.accountLocked',
    
    // 用户信息相关消息
    'User profile retrieved successfully': 'user.success.profileRetrieved',
    'Failed to retrieve user profile': 'user.errors.profileRetrieveFailed',
    'User profile updated successfully': 'user.success.profileUpdated',
    'Failed to update user profile': 'user.errors.profileUpdateFailed',
    'Public profile retrieved successfully': 'user.success.publicProfileRetrieved',
    'Failed to retrieve public profile': 'user.errors.publicProfileRetrieveFailed',
    
    // 头像上传相关消息
    '请使用字段名 "avatar" 上传文件': 'avatar.errors.invalidFieldName',
    '文件大小不能超过 5MB': 'avatar.errors.fileSizeExceeded',
    '只允许上传图片文件': 'avatar.errors.invalidFileType',
    '文件上传失败': 'avatar.errors.uploadFailed',
    '请选择要上传的头像文件': 'avatar.errors.noFileSelected',
    '无权限修改其他用户的头像': 'avatar.errors.noPermission',
    '用户不存在': 'user.errors.notFound',
    '头像文件大小不能超过 5MB': 'avatar.errors.avatarSizeExceeded',
    '图片处理失败，请检查图片格式是否正确': 'avatar.errors.imageProcessingFailed',
    '头像更新成功': 'avatar.success.updated',
    '头像更新失败': 'avatar.errors.updateFailed',
    
    // 系统头像相关消息
    '系统头像目录不存在': 'avatar.errors.systemDirectoryNotFound',
    '系统头像列表获取成功': 'avatar.success.systemAvatarsRetrieved',
    '获取系统头像列表失败': 'avatar.errors.systemAvatarsRetrieveFailed',
    '文件名不能为空，且只支持PNG文件': 'avatar.errors.invalidSystemAvatarFilename',
    '头像文件不存在': 'avatar.errors.systemAvatarNotFound',
    '读取头像文件失败': 'avatar.errors.systemAvatarReadFailed',
    '获取系统头像文件失败': 'avatar.errors.systemAvatarRetrieveFailed',
    '系统头像设置成功': 'avatar.success.systemAvatarSet',
    '设置系统头像失败': 'avatar.errors.systemAvatarSetFailed',
    
    
    // 认证相关消息
    'Access token required': 'auth.errors.accessTokenRequired',
    'Invalid or expired token': 'auth.errors.invalidOrExpiredToken',
    'Token has expired': 'auth.errors.tokenExpired',
    'Invalid token': 'auth.errors.invalidToken',
    
    // 新的错误代码（后端返回的code字段）
    'TOKEN_MISSING': 'auth.errors.tokenMissing',
    'TOKEN_EXPIRED': 'auth.errors.tokenExpired',
    'TOKEN_INVALID': 'auth.errors.invalidToken',
    'TOKEN_ERROR': 'auth.errors.tokenError',
    'AUTH_REQUIRED': 'auth.errors.authRequired',
    'ADMIN_REQUIRED': 'auth.errors.adminRequired',
    
    // 资源相关消息
    'Resource created successfully': 'resource.success.created',
    'Failed to create resource': 'resource.errors.createFailed',
    'Resources retrieved successfully': 'resource.success.retrieved',
    'Failed to retrieve resources': 'resource.errors.retrieveFailed',
    'Authentication required to view favorited resources': 'resource.errors.authRequiredForFavorites',
    '无效的资源ID': 'resource.errors.invalidId',
    '资源不存在': 'resource.errors.notFound',
    '已收藏': 'resource.success.alreadyFavorited',
    '收藏成功': 'resource.success.favorited',
    '收藏失败': 'resource.errors.favoriteFailed',
    '已取消收藏': 'resource.success.unfavorited',
    '取消收藏失败': 'resource.errors.unfavoriteFailed',
    '点赞成功': 'resource.success.liked',
    '点赞失败': 'resource.errors.likeFailed',
    '已取消点赞': 'resource.success.unliked',
    '取消点赞失败': 'resource.errors.unlikeFailed',
    '只有文件类型资源可下载': 'resource.errors.onlyFileTypeDownloadable',
    '文件不存在': 'resource.errors.fileNotFound',
    '下载失败': 'resource.errors.downloadFailed',
    '无权限删除此资源': 'resource.errors.noPermissionToDelete',
    '资源删除成功': 'resource.success.deleted',
    '删除失败': 'resource.errors.deleteFailed',
    '文件大小不能超过 20MB': 'resource.errors.fileSizeExceeded',
    '文件上传失败: ': 'resource.errors.uploadFailed',
    'type 必须是 file/link/note': 'resource.errors.invalidType',
    'title 必填': 'resource.errors.titleRequired',
    'visibility 必须是 public/course/private': 'resource.errors.invalidVisibility',
    '请通过字段名 file 上传文件': 'resource.errors.invalidFileFieldName',
    'link 类型需要提供 url_or_path': 'resource.errors.urlOrPathRequired',
    
    // 通知相关消息
    'Validation failed': 'notification.errors.validationFailed',
    'Notification created successfully': 'notification.success.created',
    'Failed to create notification': 'notification.errors.createFailed',
    'Some user_ids do not exist': 'notification.errors.someUserIdsNotExist',
    'Notifications created successfully': 'notification.success.batchCreated',
    'Failed to create notifications': 'notification.errors.batchCreateFailed',
    'Invalid token payload: user id missing': 'auth.errors.invalidTokenPayload',
    'Notifications retrieved successfully': 'notification.success.retrieved',
    'Failed to retrieve notifications': 'notification.errors.retrieveFailed',
    'Unread count retrieved successfully': 'notification.success.unreadCountRetrieved',
    'Failed to retrieve unread count': 'notification.errors.unreadCountRetrieveFailed',
    'Notification not found': 'notification.errors.notFound',
    'Notification retrieved successfully': 'notification.success.retrievedSingle',
    'Failed to retrieve notification': 'notification.errors.retrieveSingleFailed',
    'Notification marked as read': 'notification.success.markedAsRead',
    'Failed to mark notification as read': 'notification.errors.markAsReadFailed',
    'All notifications marked as read': 'notification.success.allMarkedAsRead',
    'Failed to mark all notifications as read': 'notification.errors.markAllAsReadFailed',
    'Notification deleted successfully': 'notification.success.deleted',
    'Failed to delete notification': 'notification.errors.deleteFailed'
  };

  const translationKey = messageMap[message];
  
  if (translationKey) {
    return t(translationKey, { ns: 'messages' });
  }
  
  return message;
}

export function translateApiMessage(
  messageResponse: BackendMessageResponse | ApiResponse | string,
  t: TFunction,
  fallbackKey?: string
): string {
  const translated = translateBackendMessage(messageResponse, t);
  
  if (translated === (typeof messageResponse === 'string' ? messageResponse : messageResponse.message)) {
    return fallbackKey ? t(fallbackKey) : translated;
  }
  
  return translated;
}

export function translateAvatarName(filename: string, t: TFunction): string {
  const avatarNameMap: Record<string, string> = {
    'AustralianBeefBurger.png': 'avatar.names.australianBeefBurger',
    'YourGrade.png': 'avatar.names.yourGrade',
    'Kim.png': 'avatar.names.kim'
  };

  const translationKey = avatarNameMap[filename];
  if (translationKey) {
    return t(translationKey, { ns: 'common' });
  }
  
  return filename;
}
