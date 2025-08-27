import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Text,
  Title,
  Paragraph,
  Button,
  TextInput,
  Chip,
  Divider,
  ActivityIndicator,
  Surface,
  List,
  IconButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { COLORS, SPACING, SHADOWS } from '../utils/theme';
import { useAuth } from '../context/AuthContext';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  threshold: number;
  unit: string;
}

interface RequestItem {
  inventory_item_id: string;
  quantity: number;
  itemName: string;
  unit: string;
  currentStock: number;
  threshold: number;
}

const InventoryRequestScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [requestItems, setRequestItems] = useState<RequestItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadInventoryItems();
  }, []);

  const loadInventoryItems = async () => {
    try {
      setLoading(true);
      
      // For demo purposes, using mock data
      // In production, this would be an API call
      const mockItems: InventoryItem[] = [
        {
          id: '1',
          name: 'Sako',
          quantity: 2000,
          threshold: 500,
          unit: 'Bundles'
        },
        {
          id: '2',
          name: 'Dust Pan',
          quantity: 1200,
          threshold: 300,
          unit: 'Pcs'
        },
        {
          id: '3',
          name: 'Walis Tingting (Kaong)',
          quantity: 2400,
          threshold: 500,
          unit: 'Pcs'
        },
        {
          id: '4',
          name: 'Knitted Gloves',
          quantity: 4000,
          threshold: 1000,
          unit: 'Pairs'
        },
        {
          id: '5',
          name: 'Rubber Gloves',
          quantity: 400,
          threshold: 100,
          unit: 'Pairs'
        },
        {
          id: '6',
          name: 'Raincoat',
          quantity: 500,
          threshold: 100,
          unit: 'Pcs'
        },
        {
          id: '7',
          name: 'Sickle (Karit) RS Brand',
          quantity: 0,
          threshold: 50,
          unit: 'Pcs'
        },
        {
          id: '8',
          name: 'Panabas (Itak) RS Brand',
          quantity: 0,
          threshold: 50,
          unit: 'Pcs'
        },
        {
          id: '9',
          name: 'Hasaan (WhetStone)',
          quantity: 14,
          threshold: 20,
          unit: 'Pcs'
        },
        {
          id: '10',
          name: 'Boots',
          quantity: 500,
          threshold: 100,
          unit: 'Pairs'
        },
        {
          id: '11',
          name: 'Kalaykay',
          quantity: 20,
          threshold: 30,
          unit: 'Pcs'
        },
        {
          id: '12',
          name: 'Palang Lapad No.8',
          quantity: 125,
          threshold: 50,
          unit: 'Pcs'
        },
        {
          id: '13',
          name: 'Asarol',
          quantity: 125,
          threshold: 50,
          unit: 'Pcs'
        }
      ];

      setInventoryItems(mockItems);
    } catch (error) {
      console.error('Error loading inventory items:', error);
      Alert.alert('Error', 'Failed to load inventory items');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInventoryItems();
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) return 'Out of Stock';
    if (item.quantity < item.threshold) return 'Low Stock';
    return 'In Stock';
  };

  const getStockStatusColor = (item: InventoryItem) => {
    if (item.quantity === 0) return COLORS.error;
    if (item.quantity < item.threshold) return COLORS.warning;
    return COLORS.success;
  };

  const getStockStatusIcon = (item: InventoryItem) => {
    if (item.quantity === 0) return 'error';
    if (item.quantity < item.threshold) return 'warning';
    return 'check-circle';
  };

  const addItemToRequest = () => {
    if (!selectedItem || !quantity || parseInt(quantity) <= 0) {
      Alert.alert('Error', 'Please select an item and enter a valid quantity');
      return;
    }

    const item = inventoryItems.find(i => i.id === selectedItem);
    if (!item) return;

    // Check if item already exists in request
    const existingIndex = requestItems.findIndex(r => r.inventory_item_id === selectedItem);
    
    if (existingIndex >= 0) {
      // Update existing item
      const updatedItems = [...requestItems];
      updatedItems[existingIndex].quantity += parseInt(quantity);
      setRequestItems(updatedItems);
    } else {
      // Add new item
      const newItem: RequestItem = {
        inventory_item_id: selectedItem,
        quantity: parseInt(quantity),
        itemName: item.name,
        unit: item.unit,
        currentStock: item.quantity,
        threshold: item.threshold
      };
      setRequestItems([...requestItems, newItem]);
    }

    // Reset form
    setSelectedItem('');
    setQuantity('1');
    setShowAddModal(false);
  };

  const removeItemFromRequest = (index: number) => {
    setRequestItems(requestItems.filter((_, i) => i !== index));
  };

  const submitRequest = async () => {
    if (requestItems.length === 0) {
      Alert.alert('Error', 'Please add at least one item to the request');
      return;
    }

    if (!reason.trim()) {
      Alert.alert('Error', 'Please provide a reason for the request');
      return;
    }

    try {
      setSubmitting(true);

      const requestData = {
        items: requestItems.map(item => ({
          inventory_item_id: item.inventory_item_id,
          quantity: item.quantity
        })),
        reason: reason.trim(),
        request_date: new Date().toISOString().split('T')[0]
      };

      // For demo purposes, simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Save to local storage for demo
      const existingRequests = await AsyncStorage.getItem('inventory_requests') || '[]';
      const requests = JSON.parse(existingRequests);
      requests.push({
        id: Date.now().toString(),
        ...requestData,
        status: 'pending',
        created_at: new Date().toISOString()
      });
      await AsyncStorage.setItem('inventory_requests', JSON.stringify(requests));

      Alert.alert(
        'Success',
        'Inventory request submitted successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setRequestItems([]);
              setReason('');
              navigation.goBack();
            }
          }
        ]
      );

    } catch (error) {
      console.error('Error submitting request:', error);
      Alert.alert('Error', 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getSuggestedItems = () => {
    return inventoryItems.filter(item => 
      item.quantity === 0 || item.quantity < item.threshold
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading inventory items...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >


        {/* Suggested Items */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="lightbulb" size={20} color={COLORS.warning} />
              <Title style={styles.sectionTitle}>Suggested Items</Title>
            </View>
            <Text style={styles.sectionSubtitle}>Items that are low or out of stock</Text>
            <View style={styles.suggestedContainer}>
              {getSuggestedItems().length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialIcons name="check-circle" size={48} color={COLORS.success} />
                  <Text style={styles.emptyStateText}>All items are well stocked!</Text>
                </View>
              ) : (
                getSuggestedItems().map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.suggestedItem}
                    onPress={() => {
                      setSelectedItem(item.id);
                      setQuantity(Math.max(1, item.threshold - item.quantity).toString());
                      setShowAddModal(true);
                    }}
                  >
                    <View style={styles.suggestedItemContent}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemDetails}>
                        Current: {item.quantity} {item.unit} (Threshold: {item.threshold})
                      </Text>
                    </View>
                    <View style={styles.suggestedItemActions}>
                    <Chip
                      style={[
                        styles.statusChip,
                        { backgroundColor: getStockStatusColor(item) + '20' }
                      ]}
                      textStyle={{ 
                        color: getStockStatusColor(item),
                        fontWeight: '600',
                        lineHeight: 18,
                      }}
                    >
                      {getStockStatus(item)}
                    </Chip>
                      <MaterialIcons name="add-circle" size={24} color={COLORS.primary} />
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Add Items */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.addItemHeader}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="add-shopping-cart" size={20} color={COLORS.primary} />
              <Title style={styles.sectionTitle}>Add Items</Title>
              </View>
              <Button
                mode="contained"
                onPress={() => setShowAddModal(true)}
                style={styles.addButton}
                icon="plus"
                contentStyle={styles.addButtonContent}
              >
                Add Item
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Request Items List */}
        {requestItems.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="list-alt" size={20} color={COLORS.info} />
              <Title style={styles.sectionTitle}>Request Items</Title>
                <Chip style={styles.itemCountChip} textStyle={{ color: 'white' }}>
                  {requestItems.length} item{requestItems.length !== 1 ? 's' : ''}
                </Chip>
              </View>
              {requestItems.map((item, index) => (
                <View key={index} style={styles.requestItem}>
                  <View style={styles.requestItemContent}>
                    <Text style={styles.itemName}>{item.itemName}</Text>
                    <Text style={styles.itemQuantity}>
                      {item.quantity} {item.unit}
                    </Text>
                  </View>
                  <IconButton
                    icon="delete"
                    size={20}
                    onPress={() => removeItemFromRequest(index)}
                    style={styles.deleteButton}
                    iconColor={COLORS.error}
                  />
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Reason */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="description" size={20} color={COLORS.secondary} />
            <Title style={styles.sectionTitle}>Reason for Request</Title>
            </View>
            <TextInput
              mode="outlined"
              multiline
              numberOfLines={4}
              placeholder="Explain why these items are needed..."
              value={reason}
              onChangeText={setReason}
              style={styles.reasonInput}
              outlineStyle={styles.inputOutline}
            />
          </Card.Content>
        </Card>

        {/* Submit Button */}
        <Button
          mode="contained"
          onPress={submitRequest}
          disabled={requestItems.length === 0 || !reason.trim() || submitting}
          style={styles.submitButton}
          loading={submitting}
          icon="send"
          contentStyle={styles.submitButtonContent}
        >
          {submitting ? 'Submitting...' : 'Submit Request'}
        </Button>
      </ScrollView>

      {/* Add Item Modal */}
      {showAddModal && (
        <View style={styles.modalOverlay}>
          <Surface style={styles.modal}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <MaterialIcons name="add-shopping-cart" size={24} color={COLORS.primary} />
                <Title style={styles.modalTitle}>Add Item to Request</Title>
              </View>
              <IconButton
                icon="close"
                size={24}
                onPress={() => setShowAddModal(false)}
                iconColor={COLORS.text.secondary}
              />
            </View>
            
            <View style={styles.modalContent}>
              <View style={styles.modalInputContainer}>
                <Text style={styles.modalInputLabel}>Select Item</Text>
                <TouchableOpacity
                  style={styles.itemSelector}
                  onPress={() => {
                    // Show item picker
                  }}
                >
                  {selectedItem ? (
                    <Text style={styles.selectedItemText}>
                      {inventoryItems.find(i => i.id === selectedItem)?.name}
                    </Text>
                  ) : (
                    <Text style={styles.placeholderText}>Choose an item...</Text>
                  )}
                  <MaterialIcons name="arrow-drop-down" size={24} color={COLORS.text.secondary} />
                </TouchableOpacity>
                
                    <ScrollView style={styles.itemDropdown}>
                      {inventoryItems.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.dropdownItem}
                          onPress={() => setSelectedItem(item.id)}
                        >
                      <View style={styles.dropdownItemContent}>
                          <Text style={styles.dropdownItemText}>{item.name}</Text>
                          <Text style={styles.dropdownItemDetails}>
                            {item.quantity} {item.unit} - {getStockStatus(item)}
                          </Text>
                      </View>
                      <MaterialIcons 
                        name={getStockStatusIcon(item)} 
                        size={16} 
                        color={getStockStatusColor(item)} 
                      />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
              
              <View style={styles.modalInputContainer}>
                <Text style={styles.modalInputLabel}>Quantity</Text>
              <TextInput
                mode="outlined"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                style={styles.modalInput}
                  outlineStyle={styles.inputOutline}
                  right={<TextInput.Affix text={inventoryItems.find(i => i.id === selectedItem)?.unit || ''} />}
              />
              </View>
            </View>
            
            <View style={styles.modalFooter}>
              <Button
                mode="outlined"
                onPress={() => setShowAddModal(false)}
                style={styles.modalButton}
                contentStyle={styles.modalButtonContent}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={addItemToRequest}
                disabled={!selectedItem || !quantity || parseInt(quantity) <= 0}
                style={styles.modalButton}
                contentStyle={styles.modalButtonContent}
                icon="plus"
              >
                Add Item
              </Button>
            </View>
          </Surface>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },

  card: {
    margin: SPACING.m,
    marginTop: SPACING.s,
    borderRadius: 12,
    ...SHADOWS.medium,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  sectionTitle: {
    fontSize: 18,
    marginLeft: SPACING.s,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: SPACING.m,
    fontStyle: 'italic',
  },
  suggestedContainer: {
    gap: SPACING.s,
  },
  suggestedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  suggestedItemContent: {
    flex: 1,
  },
  suggestedItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  statusChip: {
    paddingVertical: 4,
    minHeight: 28,
  },
  addItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  addButtonContent: {
    height: 40,
  },
  itemCountChip: {
    backgroundColor: COLORS.info,
    marginLeft: 'auto',
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  requestItemContent: {
    flex: 1,
  },
  itemQuantity: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  deleteButton: {
    margin: 0,
  },
  reasonInput: {
    marginTop: SPACING.s,
  },
  inputOutline: {
    borderRadius: 8,
  },
  submitButton: {
    margin: SPACING.m,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    elevation: 4,
  },
  submitButtonContent: {
    height: 50,
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyStateText: {
    marginTop: SPACING.m,
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: SPACING.m,
    color: COLORS.text.secondary,
    fontSize: 16,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.m,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    ...SHADOWS.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    marginLeft: SPACING.s,
    fontSize: 18,
  },
  modalContent: {
    padding: SPACING.m,
  },
  modalInputContainer: {
    marginBottom: SPACING.m,
  },
  modalInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.s,
  },
  itemSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  selectedItemText: {
    fontSize: 16,
    color: COLORS.text.primary,
  },
  placeholderText: {
    fontSize: 16,
    color: COLORS.text.disabled,
  },
  modalInput: {
    backgroundColor: 'white',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: SPACING.m,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    gap: SPACING.s,
  },
  modalButton: {
    minWidth: 100,
    borderRadius: 8,
  },
  modalButtonContent: {
    height: 40,
  },
  itemDropdown: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: 8,
    marginTop: 4,
    backgroundColor: 'white',
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  dropdownItemContent: {
    flex: 1,
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  dropdownItemDetails: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
});

export default InventoryRequestScreen;
