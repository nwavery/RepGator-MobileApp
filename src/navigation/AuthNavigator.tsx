import { createNativeStackNavigator } from '@react-navigation/native-stack';

export type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
};

export const AuthStack = createNativeStackNavigator<AuthStackParamList>(); 