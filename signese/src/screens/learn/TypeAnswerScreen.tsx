import React, { useState, useMemo } from "react";
// ...other imports...

export function TypeAnswerScreen() {
  // ...existing code...
  const sign = getSignByOrder(lessonId, order);
  const nextSign = getNextSign(lessonId, order);
  const progress = calculateProgress(lessonId, order, "type");

  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const inputPlaceholder =
    lessonId === "alphabet"
      ? "Type a letter (A-Z)"
      : lessonId === "numbers"
      ? "Type a number (0-9)"
      : "Type your answer";

  const feedback = useMemo(() => {
    if (!submitted || !sign) {
      return "";
    }
    if (isCorrect) {
      return "Nice work";
    }
    return `Accepted answer: ${sign.acceptedAnswers[0]}`;
  }, [isCorrect, sign, submitted]);

  if (!sign) {
    return (
      <ScreenContainer backgroundColor={lessonColors.background} contentPadded>
        <ScreenHeader title={lessonId === "numbers" ? "Type Number" : "Type Answer"} showBackButton />
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Could not find this sign.</Text>
        </View>
      </ScreenContainer>
    );
  }

  const handleSubmitOrContinue = () => {
    if (!submitted) {
      const correct = isTypedAnswerCorrect(value, sign.acceptedAnswers);
      setIsCorrect(correct);
      setSubmitted(true);
      return;
    }

    const updatedScore = score + (isCorrect ? 1 : 0);
    // ...navigation or next logic here...
  };

  return (
    <ScreenContainer backgroundColor={lessonColors.background} contentPadded>
      <ScreenHeader title={lessonId === "numbers" ? "Type Number" : "Type Answer"} showBackButton />
      <View style={styles.content}>
        <LessonHeader title={lessonId === "numbers" ? "Type the number" : "Type the meaning"} />
        <LessonProgressBar currentStep={progress.currentStep} totalSteps={progress.totalSteps} />

        <SignLessonCard gif={sign.gif} instruction={lessonId === "numbers" ? "Type what this number is." : "Type what this sign means."} />

        <View style={styles.inputWrap}>
          <TypingAnswerInput
            value={value}
            onChangeText={setValue}
            placeholder={inputPlaceholder}
            editable={!submitted}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {submitted ? (
          <Text style={[styles.feedback, isCorrect ? styles.correct : styles.incorrect]}>{feedback}</Text>
        ) : null}

        <View style={styles.footer}>
          <PrimaryActionButton
            label={submitted ? "Continue" : "Submit"}
            onPress={handleSubmitOrContinue}
            disabled={!value && !submitted}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}
