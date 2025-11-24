import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:mobile/core/network/dio_client.dart';
import 'leaderboard_model.dart';
import '../../auth/data/auth_service.dart';

class LeaderboardService {
  final DioClient _client = DioClient();

  Future<List<LeaderboardEntry>> getLeaderboard() async {
    try {
      final response = await _client.dio.get("/leaderboard");

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => LeaderboardEntry.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load leaderboard');
      }
    } catch (e,s) {
      debugPrint('Error fetching leaderboard: $e');
      debugPrint('Stack trace: $s');
      throw Exception(e.toString());
    }
  }
}
