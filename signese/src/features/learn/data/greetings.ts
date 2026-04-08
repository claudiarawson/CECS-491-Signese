export type GreetingLearnItem = {
  id: string;
  label: string;
  image: any;
};

export const GREETINGS_LEARN_ITEMS: GreetingLearnItem[] = [
  {
    id: "hello",
    label: "Hello",
    image: require("@/assets/asl/greetings/hello/hello.gif"),
  },
  {
    id: "how_are_you",
    label: "How are you?",
    image: require("@/assets/asl/greetings/how_are_you/how_are_you.gif"),
  },
  {
    id: "whats_your_name",
    label: "What's your name?",
    image: require("@/assets/asl/greetings/whats_your_name/whats_your_name.gif"),
  },
  {
    id: "my_name_is",
    label: "My name is...",
    image: require("@/assets/asl/greetings/my_name_is/my_name_is.gif"),
  },
  {
    id: "good_morning",
    label: "Good morning",
    image: require("@/assets/asl/greetings/good_morning/good_morning.gif"),
  },
  {
    id: "nice_to_meet_you",
    label: "Nice to meet you",
    image: require("@/assets/asl/greetings/nice_to_meet_you/nice_to_meet_you.gif"),
  },
  {
    id: "good_night",
    label: "Good night",
    image: require("@/assets/asl/greetings/good_night/good_night.gif"),
  },
  {
    id: "welcome",
    label: "Welcome",
    image: require("@/assets/asl/greetings/welcome/welcome.gif"),
  },
];

// Batch 1: signs 0–3
export const GREETINGS_BATCH_1 = GREETINGS_LEARN_ITEMS.slice(0, 4);
// Batch 2: signs 4–7
export const GREETINGS_BATCH_2 = GREETINGS_LEARN_ITEMS.slice(4, 8);
