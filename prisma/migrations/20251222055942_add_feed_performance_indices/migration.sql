-- CreateIndex
CREATE INDEX "Comment_questionId_idx" ON "Comment"("questionId");

-- CreateIndex
CREATE INDEX "Like_userId_questionId_idx" ON "Like"("userId", "questionId");

-- CreateIndex
CREATE INDEX "Question_tags_idx" ON "Question"("tags");

-- CreateIndex
CREATE INDEX "Question_difficulty_idx" ON "Question"("difficulty");

-- CreateIndex
CREATE INDEX "Submission_userId_questionId_idx" ON "Submission"("userId", "questionId");

-- CreateIndex
CREATE INDEX "Submission_last_shown_at_idx" ON "Submission"("last_shown_at");

-- CreateIndex
CREATE INDEX "View_questionId_idx" ON "View"("questionId");
