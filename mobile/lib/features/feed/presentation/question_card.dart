import 'package:flutter/material.dart';
import 'package:flutter_highlight/flutter_highlight.dart';
import 'package:flutter_highlight/themes/dracula.dart';
import 'package:flutter_markdown_plus/flutter_markdown_plus.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile/features/feed/presentation/widget/custom_builder.dart';
import '../data/question_model.dart';
import '../data/feed_service.dart';

class QuestionCard extends StatefulWidget {
  final Question question;
  final ScrollController scrollController;

  const QuestionCard({super.key, required this.question, required this.scrollController});

  @override
  State<QuestionCard> createState() => _QuestionCardState();
}

class _QuestionCardState extends State<QuestionCard> {
  final FeedService _feedService = FeedService();
  int? _selectedOption;
  bool _isSubmitted = false;
  
  // Like State
  bool _isLiked = false;
  int _likesCount = 0;
  bool _isLoadingLike = false;

  @override
  void initState() {
    super.initState();
    _fetchLikeStatus();
  }

  Future<void> _fetchLikeStatus() async {
    if (widget.question.id == null) return;
    try {
      final status = await _feedService.getLikeStatus(widget.question.id!);
      if (mounted) {
        setState(() {
          _likesCount = status['likes'];
          _isLiked = status['isLiked'];
        });
      }
    } catch (e) {
      debugPrint('Error fetching like status: $e');
    }
  }

  Future<void> _toggleLike() async {
    if (widget.question.id == null || _isLoadingLike) return;
    
    setState(() {
      _isLoadingLike = true;
      // Optimistic update
      _isLiked = !_isLiked;
      _likesCount += _isLiked ? 1 : -1;
    });

    try {
      await _feedService.toggleLike(widget.question.id!);
    } catch (e) {
      // Revert on error
      if (mounted) {
        setState(() {
          _isLiked = !_isLiked;
          _likesCount += _isLiked ? 1 : -1;
        });
      }
      debugPrint('Error toggling like: $e');
    } finally {
      if (mounted) {
        setState(() {
          _isLoadingLike = false;
        });
      }
    }
  }

  void _showComments() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF1E1E1E),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => CommentsSheet(questionId: widget.question.id!),
    );
  }

  Future<void> _submitAnswer(int index) async {
    if (_isSubmitted) return;
    
    setState(() {
      _selectedOption = index;
      _isSubmitted = true;
    });

    if (widget.question.id != null) {
      try {
        await _feedService.submitAnswer(widget.question.id!, index);
      } catch (e) {
        debugPrint('Error submitting answer: $e');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to submit answer: $e')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isCorrect = _selectedOption == widget.question.correctOption;

    return Container(
      color: const Color(0xFF1E1E1E), // VS Code Dark Background
      child: SingleChildScrollView(
        // controller: widget.scrollController,
        physics: const ClampingScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with Difficulty and Category
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Chip(
                    label: Text(
                      widget.question.difficulty,
                      style: const TextStyle(color: Colors.black, fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                    backgroundColor: _getDifficultyColor(widget.question.difficulty),
                    padding: EdgeInsets.zero,
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  Text(
                    widget.question.category,
                    style: GoogleFonts.firaCode(color: Colors.grey[400], fontSize: 12),
                  ),
                ],
              ),
            ),

            // Title
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: MarkdownBody(
                data: widget.question.title,
                builders: {
                  "code": CustomCodeMarkdownBuilder()
                },
                styleSheet: MarkdownStyleSheet.fromTheme(Theme.of(context)).copyWith(
                  p: GoogleFonts.firaCode(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                  codeblockDecoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: Colors.grey[300]!,
                    ),
                  ),
                  codeblockPadding: const EdgeInsets.all(16),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Code Snippet (if any)
            if (widget.question.codeSnippet != null && widget.question.codeSnippet!.isNotEmpty)
              Container(
                width: double.infinity,
                color: const Color(0xFF282A36), // Dracula Background
                padding: const EdgeInsets.all(16),
                margin: const EdgeInsets.only(bottom: 16),
                child: HighlightView(
                  widget.question.codeSnippet!,
                  language: 'javascript',
                  theme: draculaTheme,
                  textStyle: GoogleFonts.firaCode(fontSize: 14),
                ),
              ),

            // Description
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: MarkdownBody(
                data: widget.question.description,
                builders: {
                  "code": CustomCodeMarkdownBuilder()
                },
                styleSheet: MarkdownStyleSheet.fromTheme(Theme.of(context)).copyWith(
                  p: GoogleFonts.firaCode(color: Colors.grey[300], fontSize: 15, height: 1.5),
                  code: GoogleFonts.firaCode(
                    backgroundColor: const Color(0xFF282A36),
                    color: const Color(0xFFFF79C6), // Dracula Pink

                  ),
                  codeblockDecoration: BoxDecoration(
                    color: const Color(0xFF282A36), // Dracula Background
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: const Color(0xFF44475A)),

                  ),
                  codeblockPadding: const EdgeInsets.all(16),
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Options
            ...List.generate(widget.question.options.length, (index) {
              final isSelected = _selectedOption == index;
              final isCorrectOption = index == widget.question.correctOption;
              
              Color borderColor = const Color(0xFF3E3E3E);
              Color backgroundColor = const Color(0xFF252526); // VS Code Sidebar/Input bg

              if (_isSubmitted) {
                if (isSelected) {
                  borderColor = isCorrect ? Colors.green : Colors.red;
                  backgroundColor = isCorrect ? Colors.green.withOpacity(0.1) : Colors.red.withOpacity(0.1);
                } else if (isCorrectOption) {
                  borderColor = Colors.green;
                  backgroundColor = Colors.green.withOpacity(0.1);
                }
              }

              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 6.0),
                child: InkWell(
                  onTap: () => _submitAnswer(index),
                  borderRadius: BorderRadius.circular(4),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      border: Border.all(color: borderColor),
                      borderRadius: BorderRadius.circular(4),
                      color: backgroundColor,
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: MarkdownBody(
                            data: widget.question.options[index],
                            styleSheet: MarkdownStyleSheet.fromTheme(Theme.of(context)).copyWith(
                              p: GoogleFonts.firaCode(color: Colors.grey[300], fontSize: 14),
                              code: GoogleFonts.firaCode(
                                backgroundColor: const Color(0xFF3E3E3E),
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ),
                        if (_isSubmitted && isSelected)
                          Padding(
                            padding: const EdgeInsets.only(left: 8.0),
                            child: Icon(
                              isCorrect ? Icons.check_circle : Icons.cancel,
                              color: isCorrect ? Colors.green : Colors.red,
                              size: 20,
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              );
            }),

            // Explanation
            if (_isSubmitted) ...[
              const SizedBox(height: 24),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                color: const Color(0xFF252526),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '// Explanation',
                      style: GoogleFonts.firaCode(
                        color: const Color(0xFF6272A4), // Dracula Comment Color
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 8),
                    MarkdownBody(
                      data: widget.question.explanation ?? 'No explanation provided.',
                      styleSheet: MarkdownStyleSheet.fromTheme(Theme.of(context)).copyWith(
                        p: GoogleFonts.firaCode(color: Colors.grey[300], fontSize: 14),
                        code: GoogleFonts.firaCode(
                          backgroundColor: const Color(0xFF1E1E1E),
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
            
            const SizedBox(height: 24),
            
            // Like and Comment Actions
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Row(
                children: [
                  _buildActionButton(
                    icon: Icons.favorite_border,
                    label: '// Like ($_likesCount)',
                    activeIcon: Icons.favorite,
                    activeLabel: '// Liked ($_likesCount)',
                    activeColor: Colors.red,
                    isActive: _isLiked,
                    onTap: _toggleLike,
                  ),
                  const SizedBox(width: 24),
                  _buildActionButton(
                    icon: Icons.comment_outlined,
                    label: '/* Comment */',
                    onTap: _showComments,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 80),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    IconData? activeIcon,
    String? activeLabel,
    Color? activeColor,
    bool isActive = false,
    VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Row(
        children: [
          Icon(
            isActive && activeIcon != null ? activeIcon : icon,
            color: isActive && activeColor != null ? activeColor : const Color(0xFF6272A4),
            size: 20,
          ),
          const SizedBox(width: 8),
          Text(
            isActive && activeLabel != null ? activeLabel : label,
            style: GoogleFonts.firaCode(
              color: const Color(0xFF6272A4), // Dracula Comment Color
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  Color _getDifficultyColor(String difficulty) {
    switch (difficulty.toUpperCase()) {
      case 'EASY':
        return const Color(0xFF50FA7B); // Dracula Green
      case 'MEDIUM':
        return const Color(0xFFFFB86C); // Dracula Orange
      case 'HARD':
        return const Color(0xFFFF5555); // Dracula Red
      default:
        return Colors.grey;
    }
  }
}

class CommentsSheet extends StatefulWidget {
  final String questionId;

  const CommentsSheet({super.key, required this.questionId});

  @override
  State<CommentsSheet> createState() => _CommentsSheetState();
}

class _CommentsSheetState extends State<CommentsSheet> {
  final FeedService _feedService = FeedService();
  final TextEditingController _commentController = TextEditingController();
  List<dynamic> _comments = [];
  bool _isLoading = true;
  bool _isPosting = false;

  @override
  void initState() {
    super.initState();
    _loadComments();
  }

  Future<void> _loadComments() async {
    try {
      final comments = await _feedService.getComments(widget.questionId);
      if (mounted) {
        setState(() {
          _comments = comments;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _postComment() async {
    if (_commentController.text.trim().isEmpty) return;

    setState(() {
      _isPosting = true;
    });

    try {
      final newComment = await _feedService.postComment(
        widget.questionId,
        _commentController.text.trim(),
      );
      if (mounted) {
        setState(() {
          _comments.insert(0, newComment);
          _commentController.clear();
        });
      }
    } catch (e) {
      // Handle error
    } finally {
      if (mounted) {
        setState(() {
          _isPosting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Text(
              '// Comments',
              style: GoogleFonts.firaCode(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _comments.isEmpty
                    ? Center(
                        child: Text(
                          'No comments yet.',
                          style: GoogleFonts.firaCode(color: Colors.grey),
                        ),
                      )
                    : ListView.builder(
                        itemCount: _comments.length,
                        itemBuilder: (context, index) {
                          final comment = _comments[index];
                          return ListTile(
                            leading: CircleAvatar(
                              backgroundColor: Colors.grey[800],
                              child: Text(
                                (comment['user']['name'] ?? 'U')[0].toUpperCase(),
                                style: const TextStyle(color: Colors.white),
                              ),
                            ),
                            title: Text(
                              comment['user']['name'] ?? 'User',
                              style: GoogleFonts.firaCode(
                                color: Colors.green,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            subtitle: Text(
                              comment['content'],
                              style: GoogleFonts.firaCode(color: Colors.white70),
                            ),
                          );
                        },
                      ),
          ),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _commentController,
                    style: GoogleFonts.firaCode(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: '/* Add a comment... */',
                      hintStyle: GoogleFonts.firaCode(color: Colors.grey),
                      filled: true,
                      fillColor: const Color(0xFF2D2D2D),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  onPressed: _isPosting ? null : _postComment,
                  icon: _isPosting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.send, color: Colors.green),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
