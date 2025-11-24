import 'package:dio/dio.dart';
import '../../../core/network/dio_client.dart';
import 'question_model.dart';

class FeedService {
  final DioClient _dioClient = DioClient();

  Future<List<Question>> getQuestions({int page = 1, int limit = 10}) async {
    try {
      final response = await _dioClient.dio.get(
        '/questions',
        queryParameters: {'page': page, 'limit': limit},
      );

      if (response.statusCode == 200) {
        final data = response.data;
        final List<dynamic> questionsJson = data['questions'];
        return questionsJson.map((json) => Question.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load questions');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['error'] ?? e.message);
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  Future<Map<String, dynamic>> toggleLike(String questionId) async {
    try {
      final response = await _dioClient.dio.post(
        '/questions/$questionId/like',
      );

      if (response.statusCode == 200) {
        return response.data;
      } else {
        throw Exception('Failed to toggle like');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['error'] ?? e.message);
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  Future<Map<String, dynamic>> getLikeStatus(String questionId) async {
    try {
      final response = await _dioClient.dio.get(
        '/questions/$questionId/like',
      );

      if (response.statusCode == 200) {
        return response.data;
      } else {
        throw Exception('Failed to get like status');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['error'] ?? e.message);
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  Future<List<dynamic>> getComments(String questionId) async {
    try {
      final response = await _dioClient.dio.get(
        '/questions/$questionId/comments',
      );

      if (response.statusCode == 200) {
        return response.data;
      } else {
        throw Exception('Failed to load comments');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['error'] ?? e.message);
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  Future<Map<String, dynamic>> postComment(String questionId, String content) async {
    try {
      final response = await _dioClient.dio.post(
        '/questions/$questionId/comments',
        data: {'content': content},
      );

      if (response.statusCode == 200) {
        return response.data;
      } else {
        throw Exception('Failed to post comment');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['error'] ?? e.message);
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  Future<Map<String, dynamic>> submitAnswer(String questionId, int selectedOption) async {
    try {
      final response = await _dioClient.dio.post(
        '/submit',
        data: {
          'questionId': questionId,
          'selectedOption': selectedOption,
        },
      );

      if (response.statusCode == 200) {
        return response.data;
      } else {
        throw Exception('Failed to submit answer');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['error'] ?? e.message);
    } catch (e) {
      throw Exception(e.toString());
    }
  }
}
