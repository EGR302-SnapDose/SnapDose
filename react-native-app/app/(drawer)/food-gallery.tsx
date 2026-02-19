import { Redirect } from 'expo-router';

export default function FoodGalleryRedirect() {
  return <Redirect href="/(drawer)/(tabs)/food-gallery" />;
}
