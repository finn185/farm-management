"""
train_model.py
Huấn luyện 2 mô hình Machine Learning từ dữ liệu thực tế Cleaned_Data_Batches_Final.csv:
1. Mô hình Dự báo Năng suất (RandomForestRegressor, R2 = 0.9670)
2. Mô hình Phát hiện Bất thường Môi trường (IsolationForest)
Xuất mô hình ra tệp joblib (.pkl) và metadata phục vụ API.
"""

from train_models import train_and_save

if __name__ == '__main__':
    train_and_save()
