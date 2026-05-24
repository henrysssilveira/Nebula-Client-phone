import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export function TasksScreen({ config, onSaveTasksWebhook, onBack }) {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tasksWebhook, setTasksWebhook] = useState(config?.tasksWebhookUrl || '');
  const [isConfiguring, setIsConfiguring] = useState(!config?.tasksWebhookUrl);

  useEffect(() => {
    if (config?.tasksWebhookUrl) {
      fetchTasks();
    }
  }, [config?.tasksWebhookUrl]);

  const fetchTasks = async () => {
    if (!config?.tasksWebhookUrl) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(config.tasksWebhookUrl);
      const data = await response.json();
      // Handle both single object or array of tasks
      const taskList = Array.isArray(data) ? data : [data];
      setTasks(taskList);
    } catch (error) {
      console.error('Erro ao carregar tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveWebhook = () => {
    onSaveTasksWebhook(tasksWebhook);
    setIsConfiguring(false);
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return '#FF3B30';
      case 'medium': return '#FF9500';
      case 'low': return '#34C759';
      default: return '#0D47FF';
    }
  };

  const renderTaskItem = ({ item }) => (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
          <Text style={styles.priorityText}>{item.priority?.toUpperCase()}</Text>
        </View>
        <Text style={styles.taskId}>{item.task_id}</Text>
      </View>
      <Text style={styles.taskTitle}>{item.title}</Text>
      <Text style={styles.taskDescription} numberOfLines={3}>{item.description}</Text>
      <View style={styles.taskFooter}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status || 'pending'}</Text>
        </View>
        <Text style={styles.dateText}>
          {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tasks</Text>
        <TouchableOpacity 
          onPress={() => setIsConfiguring(!isConfiguring)} 
          style={styles.configToggle}
        >
          <Ionicons name={isConfiguring ? "list-outline" : "settings-outline"} size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {isConfiguring ? (
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.configContainer}
        >
          <View style={styles.configCard}>
            <Text style={styles.configLabel}>Tasks Webhook URL</Text>
            <TextInput
              style={styles.input}
              value={tasksWebhook}
              onChangeText={setTasksWebhook}
              placeholder="https://sua-api.com/tasks"
              placeholderTextColor="#A0A0A0"
              autoCapitalize="none"
              keyboardType="url"
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveWebhook}>
              <Text style={styles.saveButtonText}>Sincronizar Tasks</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      ) : (
        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#0D47FF" />
              <Text style={styles.loaderText}>Buscando tarefas...</Text>
            </View>
          ) : (
            <FlatList
              data={tasks}
              renderItem={renderTaskItem}
              keyExtractor={(item) => item.task_id || Math.random().toString()}
              contentContainerStyle={styles.listContent}
              refreshing={isLoading}
              onRefresh={fetchTasks}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="clipboard-outline" size={64} color="#D0D0D0" />
                  <Text style={styles.emptyText}>Nenhuma tarefa encontrada</Text>
                </View>
              }
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F3F3',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000',
  },
  backButton: {
    padding: 5,
  },
  configToggle: {
    padding: 5,
  },
  content: {
    flex: 1,
  },
  configContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  configCard: {
    backgroundColor: '#FFF',
    borderRadius: 32,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  configLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#0D47FF',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    marginTop: 15,
    fontSize: 16,
    color: '#0D47FF',
    fontWeight: '600',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  taskCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  taskId: {
    fontSize: 12,
    color: '#A0A0A0',
    fontWeight: '600',
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  taskDescription: {
    fontSize: 14,
    color: '#606060',
    lineHeight: 20,
    marginBottom: 16,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  statusBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#606060',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  dateText: {
    fontSize: 12,
    color: '#A0A0A0',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: '#D0D0D0',
    fontWeight: '600',
  },
});
