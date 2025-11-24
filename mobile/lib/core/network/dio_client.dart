import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class DioClient {
  static final DioClient _instance = DioClient._internal();
  late final Dio _dio;

  factory DioClient() {
    return _instance;
  }

  DioClient._internal() {
    _dio = Dio(
      BaseOptions(
        baseUrl: 'http://localhost:3000/api', // Use 10.0.2.2 for Android Emulator
        connectTimeout: const Duration(seconds: 5),
        receiveTimeout: const Duration(seconds: 3),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final prefs = await SharedPreferences.getInstance();
          final userStr = prefs.getString('user');
          
          if (userStr != null) {
            final user = jsonDecode(userStr);
            final userId = user['id'];
            if (userId != null) {
              options.headers['x-user-id'] = userId;
            }
          }
          
          // Also add token if available (for future use)
          final token = prefs.getString('token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }

          return handler.next(options);
        },
        onError: (DioException e, handler) {
          // Handle 401 Unauthorized globally if needed
          if (e.response?.statusCode == 401) {
            // Could trigger logout here
          }
          return handler.next(e);
        },
      ),
    );
  }

  Dio get dio => _dio;
}
