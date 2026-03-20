import { Image, useColorScheme } from 'react-native'

// images
import DarkLogo from '../assets/img/Linkup_logo.png'
import LightLogo from '../assets/img/Linkup_logo.png'

const ThemedLogo = () => {
  const colorScheme = useColorScheme()
  
  const logo = colorScheme === 'dark' ? DarkLogo : LightLogo

  return (
    <Image source={logo} />
  )
}

export default ThemedLogo