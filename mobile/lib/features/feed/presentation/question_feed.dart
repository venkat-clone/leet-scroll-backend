import 'package:flutter/material.dart';
import '../data/feed_service.dart';
import '../data/question_model.dart';
import 'question_card.dart';

class QuestionFeed extends StatefulWidget {
  const QuestionFeed({super.key});

  @override
  State<QuestionFeed> createState() => _QuestionFeedState();
}

class _QuestionFeedState extends State<QuestionFeed> {
  final FeedService _feedService = FeedService();
  final PageController _pageController = PageController();
  List<Question> _questions = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadQuestions();
  }

  Future<void> _loadQuestions() async {
    try {
      final questions = await _feedService.getQuestions();
      setState(() {
        _questions = questions;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('Error: $_error'),
            ElevatedButton(
              onPressed: _loadQuestions,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    return NestedScrollView(
      floatHeaderSlivers: true,
      headerSliverBuilder: (BuildContext context, bool innerBoxIsScrolled) => [],
      body: PageView.builder(
        controller: _pageController,
        scrollDirection: Axis.vertical,
        itemCount: _questions.length,
        itemBuilder: (context, index) {
          return SafeArea(
            child: QuestionCard(
              question: _questions[index],
              scrollController: _pageController,
            ),
          );
        },
      ),
    );
  }
}
