import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from "@react-navigation/native";

export default function LoginScreen() {

    const navigation = useNavigation(); 

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        if (username === 'Arthur' && password === 'Arthur/11') {
            navigation.navigate('ToDo');
        } else {
            Alert.alert('Login inválido', 'Nome de usuário ou senha incorretos.');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Login</Text>
            <TextInput
                placeholder="Nome"
                style={styles.textInput}
                value={username}
                onChangeText={setUsername}
                placeholderTextColor={'#b4b3b5'}
            />
            <TextInput
                placeholder="Senha"
                style={styles.textInput}
                secureTextEntry={true}
                value={password}
                onChangeText={setPassword}
                placeholderTextColor={'#b4b3b5'}
            />
            <Text style={styles.forget}>Esqueceu a senha?</Text>
            <TouchableOpacity style={styles.touch} onPress={handleLogin}>
                <Text style={styles.btnLogin}>Login</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#1c132e'
    },
    text: {
        marginTop: 100,
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white'
    },
    textInput: {
        borderWidth: 2,
        borderColor: '#302252',
        padding: 12,
        borderRadius: 25,
        marginTop: 10,
        color: 'white'
    },
    forget: {
        textAlign: 'right',
        color: '#424bf5',
        marginRight: 20,
        marginVertical: 5,
    },
    btnLogin: {
        backgroundColor: '#302252',
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
        borderRadius: 25,
        padding: 15,
        marginTop: 15,
    },
    heading: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 10,
        marginTop: 380,
        marginLeft: 20
      },
});