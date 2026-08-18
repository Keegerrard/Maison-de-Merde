"use client";

import { motion, type MotionValue } from "framer-motion";

export default function BristolMorphPath({
  d,
  fill,
}: {
  d: MotionValue<string>;
  fill: MotionValue<string>;
}) {
  return <motion.path d={d} fill={fill} />;
}
