export const yogaPlans = [
  {
    id: "morning-warmup",
    title: "Morning Sun Protocol",
    duration: "4 Min",
    level: "Beginner",
    description: "A quick, energizing flow to wake up the spine and activate the core before starting your day.",
    color: "from-coral-400 to-coral-600",
    routine: [
      {
        type: "pose",
        pose_name: "Dog",
        sanskrit_name: "Adho Mukha Svanasana",
        description: "Come onto hands and knees. Exhale, lift your knees and push your thighs back, stretching your heels toward the floor. Lengthen the spine.",
        duration: 30,
        audioSrc: "/audio/poses/dog.mp3",
        textInstruction: "Let's begin in Downward Facing Dog. Plant your hands firmly, lift your hips high, and press your chest toward your thighs. Breathe deeply."
      },
      {
        type: "pose",
        pose_name: "Cobra",
        sanskrit_name: "Bhujangasana",
        description: "Lie prone on the floor. Stretch your legs back. Inhale and lift your chest, keeping your elbows hugged in.",
        duration: 30,
        audioSrc: "/audio/poses/cobra.mp3",
        textInstruction: "Lower down to your stomach. Place your hands under your shoulders, and gently peel your chest off the mat into Cobra pose. Keep your neck long."
      },
      {
        type: "breathing",
        pose_name: "Breathwork",
        sanskrit_name: "Pranayama",
        description: "Find a comfortable seat. We will perform the 4-7-8 breathing technique to center the mind.",
        duration: 45,
        audioSrc: "/audio/poses/breathwork_morning.mp3",
        textInstruction: "Find a comfortable seat. We will do 4-7-8 breathing. Inhale for 4, hold for 7, and exhale for 8."
      },
      {
        type: "pose",
        pose_name: "Chair",
        sanskrit_name: "Utkatasana",
        description: "Stand tall. Inhale, lift arms. Exhale, bend knees keeping thighs parallel to the floor.",
        duration: 30,
        audioSrc: "/audio/poses/chair.mp3",
        textInstruction: "Rise up to standing. Bend your knees deeply, sit your hips back, and reach your arms high into Chair pose. Engage your core."
      }
    ]
  },
  {
    id: "core-builder",
    title: "Core & Balance",
    duration: "5 Min",
    level: "Intermediate",
    description: "A strengthening sequence designed to fire up the abdominal wall and improve single-leg stability.",
    color: "from-mint-400 to-mint-600",
    routine: [
      {
        type: "breathing",
        pose_name: "Breathwork",
        sanskrit_name: "Pranayama",
        description: "Prepare the body by oxygenating the muscles deeply before exertion.",
        duration: 30,
        audioSrc: "/audio/poses/breathwork_core.mp3",
        textInstruction: "Take a few deep breaths to focus your mind. Prepare your core for the upcoming balance work."
      },
      {
        type: "pose",
        pose_name: "Warrior",
        sanskrit_name: "Virabhadrasana III",
        description: "Begin in a lunge. Lean forward until the back leg extends straight, even with the hips. Body forms a 'T' shape.",
        duration: 30,
        audioSrc: "/audio/poses/warrior.mp3",
        textInstruction: "Let's move into Warrior 3. Shift your weight onto your front leg, extend the back leg long behind you, and reach your arms forward."
      },
      {
        type: "pose",
        pose_name: "Tree",
        sanskrit_name: "Vrksasana",
        description: "Stand tall. Rest the sole of your foot against your inner thigh. Clasp hands in prayer position.",
        duration: 30,
        audioSrc: "/audio/poses/tree.mp3",
        textInstruction: "Transition gracefully into Tree pose. Place your foot on your inner thigh or calf. Press your hands together at your heart."
      },
      {
        type: "pose",
        pose_name: "Traingle", // Using Traingle intentionally to match data.js CLASS_NO
        sanskrit_name: "Trikonasana",
        description: "Stand wide. Hinge your torso over your left leg, reaching the left hand down and right arm up.",
        duration: 30,
        audioSrc: "/audio/poses/traingle.mp3",
        textInstruction: "Step wide. Reach forward and down into Triangle pose. Open your chest to the side wall and gaze up at your top hand."
      }
    ]
  },
  {
    id: "evening-wind-down",
    title: "Evening Wind Down",
    duration: "4 Min",
    level: "Beginner",
    description: "A calming sequence that relieves lower back tension and promotes deep, restorative sleep.",
    color: "from-indigo-400 to-indigo-600",
    routine: [
      {
        type: "pose",
        pose_name: "Shoulderstand",
        sanskrit_name: "Sarvangasana",
        description: "Lie down. Walk shoulders under upper back. Lift hips, extend legs up. Keep neck straight.",
        duration: 30,
        audioSrc: "/audio/poses/shoulderstand.mp3",
        textInstruction: "Carefully enter Shoulderstand. Support your lower back with your hands and extend your legs straight up toward the ceiling. Do not turn your head."
      },
      {
        type: "breathing",
        pose_name: "Breathwork",
        sanskrit_name: "Pranayama",
        description: "End your session with slow, parasympathetic breathing to lower the heart rate.",
        duration: 45,
        audioSrc: "/audio/poses/breathwork_evening.mp3",
        textInstruction: "Lower your legs gently. Rest on your back and begin deep, rhythmic breathing to slow your heart rate."
      }
    ]
  }
];
