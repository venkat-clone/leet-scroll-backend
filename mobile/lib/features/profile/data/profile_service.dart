import 'package:dio/dio.dart';
import '../../../core/network/dio_client.dart';

class ProfileService {
  final DioClient _dioClient = DioClient();

  Future<Map<String, dynamic>> getProfile() async {
    try {
      final response = await _dioClient.dio.get('/mobile/profile');

      if (response.statusCode == 200) {
        return response.data;
      } else {
        throw Exception('Failed to load profile');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['error'] ?? e.message);
    } catch (e) {
      throw Exception(e.toString());
    }
  }
}
