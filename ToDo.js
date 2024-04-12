import React, { useState, useEffect, useRef } from 'react';
import { DeviceMotion } from 'expo-sensors';
import { ScrollView, StyleSheet, Text, View, TextInput, TouchableOpacity, Platform, Image, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';


export default function ToDoScreen() {
  const [tasks, setTasks] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [taskDates, setTaskDates] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [currentTask, setCurrentTask] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [image, setImage] = useState(null);
  const [shakeDetected, setShakeDetected] = useState(false);

  const showDatePicker = () => {
    const dateToSelect = currentTask.key && taskDates[currentTask.key] ? new Date(taskDates[currentTask.key]) : selectedDate;
    setSelectedDate(dateToSelect);
    setDatePickerVisible(true);
  };

  const setTaskDate = (taskKey, date) => {
    setTaskDates(prevDates => ({
      ...prevDates,
      [taskKey]: date,
    }));
  };

  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  const handleConfirm = (date) => {
    hideDatePicker();
    if (currentTask.key) {
      setTaskDate(currentTask.key, date);
    }
  };

  const addTask = () => {
    if (inputValue.trim() === '') return;
    if (isEditing) {
      let updatedTasks = tasks.map(task =>
        task.key === currentTask.key ? { ...task, text: inputValue } : task
      );
      setTasks(updatedTasks);
      setIsEditing(false);
      setCurrentTask({});
    } else {
      const newTaskKey = Date.now().toString();
      const newTask = { key: newTaskKey, text: inputValue, image: image };
      setTaskDate(newTaskKey, selectedDate);
      setTasks([...tasks, newTask]);
      sendPushNotification(expoPushToken, newTask.text);
    }
    setInputValue('');
    setImage(null);
  };

  const startEditTask = (task) => {
    setIsEditing(true);
    setCurrentTask(task);
    setInputValue(task.text);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setCurrentTask({});
    setInputValue('');
    setSelectedDate(null);
  }

  const deleteTask = (taskKey) => {
    setTasks(tasks.filter(task => task.key !== taskKey));
    setTaskDates(prevDates => {
      const newDates = { ...prevDates };
      delete newDates[taskKey];
      return newDates;
    });
  };

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  async function sendPushNotification(expoPushToken, taskText) {
    console.log('Tarefa adicionada:', taskText);
    const message = {
      to: expoPushToken,
      sound: 'default',
      title: 'Tarefa Criada',
      body: taskText,
      data: { someData: 'goes here' },
    };

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  }

  async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notification!');
        return;
      }
      token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig.extra.eas.projectId,
      });
      console.log(token);
    } else {
      alert('Must use physical device for Push Notifications');
    }

    return token.data;
  }

  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  const pickImage = async (taskKey) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    console.log(result);

    if (!result.canceled) {
      setTasks(tasks.map(task =>
        task.key === taskKey ? { ...task, image: result.assets[0].uri } : task
      ));
    }
  };

  useEffect(() => {
    let isShakeDetected = false;
    const subscription = DeviceMotion.addListener(({ acceleration }) => {
      if (acceleration) {
        const { x, y } = acceleration;
        const threshold = 1.5;
        if (Math.abs(x) > threshold || Math.abs(y) > threshold) {
          if (!isShakeDetected) {
            isShakeDetected = true;
            _handlePressButtonAsync();
          }
        } else {
          isShakeDetected = false;
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const _handlePressButtonAsync = async () => {
    await WebBrowser.openBrowserAsync('https://catjal.github.io/site_integrantes/');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>TODO LIST</Text>
      <ScrollView style={styles.scrollView}>
        {tasks.map((task) => (
          <View key={task.key} style={styles.taskContainer}>
            <View style={styles.row}>
              <TouchableOpacity onPress={() => task.key && pickImage(task.key)}>
                {image && (
                  <TouchableOpacity onPress={() => { setopenModalImg(true) }}>
                    <Image style={styles.imgNovoContato} source={{ uri: task.image }} />
                  </TouchableOpacity>
                )}

                <TouchableOpacity onPress={() => task.key && pickImage(task.key)} style={styles.imageButton}>
                  <Text style={styles.inputImage}></Text>
                </TouchableOpacity>

                <Image source={{ uri: task.image }} style={styles.image} />
              </TouchableOpacity>
              <View style={styles.row}>
                <TouchableOpacity onPress={() => startEditTask(task)} style={styles.editButton}>
                  <Text style={styles.taskText}>{task.text}</Text>
                  <TouchableOpacity onPress={showDatePicker} style={{ marginTop: 42 }}>
                    <Text style={{ color: 'white', fontSize: 17 }}>
                      {task.key && taskDates[task.key] ? new Date(taskDates[task.key]).toLocaleDateString() : 'No date selected'}
                    </Text>
                    <DateTimePickerModal isVisible={datePickerVisible} mode="date" onConfirm={handleConfirm} onCancel={hideDatePicker} />
                  </TouchableOpacity>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteTask(task.key)} style={styles.deleteButton}>
                  <Text style={styles.deleteButtonText}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

        ))}
      </ScrollView>
      <TouchableOpacity onPress={_handlePressButtonAsync} style={styles.button}></TouchableOpacity>
      <View style={styles.inputContainer}>
        <TextInput value={inputValue} onChangeText={(text) => setInputValue(text)} placeholder="Escreva uma tarefa" placeholderTextColor="#fff" style={styles.input} />
        <TouchableOpacity onPress={() => addTask()} style={styles.addButton}>
          <Text style={{ color: '#fff' }}>Salvar</Text>
        </TouchableOpacity>
        {isEditing && (
          <TouchableOpacity onPress={() => cancelEdit()} style={styles.cancelButton}>
            <Text style={{ color: '#fff' }}>Cancelar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c132e',
    paddingTop: 50,
    color: '#fff',
  },

  modalContainer: {
    padding: 15,
    marginTop: 0,
    height: '100%',
    backgroundColor: '#1E1A3C',
  },

  inputImage: {
    color: 'white',
    fontSize: 20,
    textAlign: 'center'
  },

  row: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },

  heading: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    marginLeft: 20
  },

  scrollView: {
    marginBottom: 70
  },

  taskContainer: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 5,
    borderRadius: 20
  },

  taskText: {
    color: 'white',
    verticalAlign: 'middle',
    alignSelf: 'center',
    width: 160,
    fontSize: 18
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 35,
  },

  input: {
    flex: 1,
    color: '#fff',
    borderColor: '#fff',
    borderWidth: 1,
    marginRight: 10,
    borderRadius: 5,
    height: 40,
    padding: 5
  },

  button: {
    backgroundColor: '#1c132e',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignSelf: 'center',
    marginTop: 20,
  },

  addButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5
  },


  deleteButton: {
    backgroundColor: '#302252',
    height: 120,
    width: 60,
    borderRadius: 10
  },

  deleteButtonText: {
    marginTop: 48,
    fontSize: 17,
    padding: 4,
    color: 'white'
  },

  editButton: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#302252',
    borderRadius: 5,
    marginLeft: 10,
    marginRight: 10,
    maxHeight: 120,
    height: 120,
    width: 270,
    borderRadius: 20,
    padding: 10
  },

  cancelButton: {
    backgroundColor: '#808080',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginLeft: 10
  },

  imageContainer: {
    flex: 1,
    paddingTop: 58
  },

  footerContainer: {
    flex: 1 / 3,
    alignItems: 'center',
  },

  row: {
    display: 'flex',
    flexDirection: 'row',
  },

  imageButton: {
    backgroundColor: '#302252',
    width: 120,
    height: 120,
    borderRadius: 20
  },

  image: {
    width: 120,
    height: 120,
    marginTop: -120,
    borderRadius: 20
  },

  modalImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },

  shakeMessage: {
    color: 'white',
    fontSize: 20,
    textAlign: 'center',
    marginTop: 20,
  },
});