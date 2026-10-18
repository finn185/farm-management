"""
dataset_generator.py
Tạo tập dữ liệu nông học chuẩn hóa cho mô hình dự báo năng suất xà lách thủy canh NFT.
Sử dụng thư viện chuẩn của Python (csv, math, random) - KHÔNG phụ thuộc thư viện ngoài.
Dữ liệu được hiệu chuẩn dựa trên:
1. Nghiên cứu Frontiers in Plant Science (2022) - doi: 10.3389/fpls.2022.706042
2. Dataset Batavia Mendeley Data (2025)
3. Điều kiện khí hậu nhà màng nhiệt đới tại Việt Nam (Đà Lạt, TP.HCM, ĐBSCL).
"""

import os
import csv
import math
import random

def generate_hydroponic_dataset(n_samples: int = 5000, random_seed: int = 42, output_csv: str = None):
    random.seed(random_seed)
    
    cultivar_specs = {
        'Green Oakleaf': {'target_cycle': 35, 'base_weight': 195.0, 'leaf_rate': 0.62, 'height_rate': 0.54},
        'Lollo Rossa':   {'target_cycle': 38, 'base_weight': 180.0, 'leaf_rate': 0.68, 'height_rate': 0.48},
        'Batavia':       {'target_cycle': 40, 'base_weight': 225.0, 'leaf_rate': 0.58, 'height_rate': 0.56},
        'Romaine':       {'target_cycle': 42, 'base_weight': 240.0, 'leaf_rate': 0.52, 'height_rate': 0.65}
    }
    
    cultivar_names = list(cultivar_specs.keys())
    
    fieldnames = [
        'batch_id',
        'cultivar',
        'target_cycle_days',
        'plant_age_days',
        'leaf_count',
        'plant_height_cm',
        'avg_ec',
        'avg_ph',
        'avg_water_temp',
        'air_temp',
        'humidity_rh',
        'vpd_kpa',
        'fresh_weight_g',
        'is_harvest_ready'
    ]
    
    rows = []
    
    for i in range(n_samples):
        cultivar = random.choice(cultivar_names)
        spec = cultivar_specs[cultivar]
        
        # 1. Tuổi cây (từ 5 đến 45 ngày)
        # Phân phối tập trung giai đoạn sinh trưởng 15 - 42 ngày
        age = int(max(5, min(45, round(random.triangular(8, 30, 45)))))
        
        # 2. Đặc trưng hình thái theo tuổi cây
        leaf_var = random.gauss(1.0, 0.08)
        height_var = random.gauss(1.0, 0.09)
        
        leaf_count = int(max(2, min(32, round(age * spec['leaf_rate'] * leaf_var))))
        plant_height_cm = round(max(3.0, min(30.0, age * spec['height_rate'] * height_var)), 1)
        
        # 3. Yếu tố lý hóa nước bồn NFT tại Việt Nam
        # EC tối ưu: 1.5 - 1.85 mS/cm
        avg_ec = round(max(0.8, min(2.8, random.gauss(1.68, 0.28))), 2)
        # pH tối ưu: 5.6 - 6.2
        avg_ph = round(max(4.8, min(7.4, random.gauss(5.88, 0.35))), 2)
        # Nhiệt độ nước bồn (Mùa nóng VN: 21 - 27C)
        avg_water_temp = round(max(16.5, min(30.5, random.gauss(23.2, 2.2))), 1)
        
        # Vi khí hậu không khí
        air_temp = round(max(20.0, min(36.0, avg_water_temp + random.uniform(2.0, 5.5))), 1)
        humidity_rh = round(max(45.0, min(95.0, random.gauss(70.0, 10.0))), 1)
        
        # Áp suất hơi bão hòa thiếu hụt (VPD kPa)
        svp = 0.61078 * math.exp((17.27 * air_temp) / (air_temp + 237.3))
        vpd_kpa = round(svp * (1.0 - humidity_rh / 100.0), 2)
        
        # 4. Cơ chế sinh học tính toán sinh khối tích lũy (Sigmoid Growth curve)
        target_cycle = spec['target_cycle']
        max_potential = spec['base_weight'] * 1.10
        inflection_day = target_cycle * 0.66
        k_slope = 0.20
        
        sigmoid = 1.0 / (1.0 + math.exp(-k_slope * (age - inflection_day)))
        base_biomass = max_potential * sigmoid
        
        # Tác động của hình thái
        expected_leaves = age * spec['leaf_rate']
        leaf_ratio = max(0.6, min(1.4, leaf_count / max(2, expected_leaves)))
        expected_height = age * spec['height_rate']
        height_ratio = max(0.7, min(1.3, plant_height_cm / max(3.0, expected_height)))
        morph_factor = (leaf_ratio * 0.6 + height_ratio * 0.4)
        
        # Hệ số phạt/thưởng dinh dưỡng EC
        if avg_ec < 1.3:
            ec_factor = 0.75 + (avg_ec / 1.3) * 0.25
        elif avg_ec > 2.1:
            ec_factor = max(0.70, 1.0 - (avg_ec - 2.1) * 0.28)
        elif 1.5 <= avg_ec <= 1.85:
            ec_factor = 1.05
        else:
            ec_factor = 1.0
            
        # Hệ số phạt/thưởng pH
        if avg_ph < 5.4:
            ph_factor = max(0.75, 1.0 - (5.4 - avg_ph) * 0.25)
        elif avg_ph > 6.4:
            ph_factor = max(0.70, 1.0 - (avg_ph - 6.4) * 0.28)
        else:
            ph_factor = 1.04
            
        # Hệ số phạt nhiệt độ nước (Rất nhạy ở VN khi > 24.5C)
        if avg_water_temp > 24.5:
            temp_factor = max(0.68, 1.0 - (avg_water_temp - 24.5) * 0.055)
        elif avg_water_temp < 18.0:
            temp_factor = max(0.80, 1.0 - (18.0 - avg_water_temp) * 0.04)
        else:
            temp_factor = 1.03
            
        # Nhiễu thực nghiệm
        noise = random.gauss(0, 3.8)
        fresh_weight_g = round(max(8.0, base_biomass * morph_factor * ec_factor * ph_factor * temp_factor + noise), 1)
        
        rows.append({
            'batch_id': f'LET-SYNTH-{i+1:04d}',
            'cultivar': cultivar,
            'target_cycle_days': target_cycle,
            'plant_age_days': age,
            'leaf_count': leaf_count,
            'plant_height_cm': plant_height_cm,
            'avg_ec': avg_ec,
            'avg_ph': avg_ph,
            'avg_water_temp': avg_water_temp,
            'air_temp': air_temp,
            'humidity_rh': humidity_rh,
            'vpd_kpa': vpd_kpa,
            'fresh_weight_g': fresh_weight_g,
            'is_harvest_ready': 1 if age >= (target_cycle - 2) else 0
        })
        
    if output_csv:
        with open(output_csv, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
            
    return rows

if __name__ == '__main__':
    import sys
    if sys.stdout.encoding != 'utf-8':
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_csv = os.path.join(script_dir, 'hydroponic_lettuce_dataset.csv')
    dataset = generate_hydroponic_dataset(n_samples=5000, output_csv=output_csv)
    print(f"[OK] Da tao tap du lieu thanh cong: {output_csv}")
    print(f"[*] So luong ban ghi: {len(dataset)} dong")
    print(f"[*] Mau dau tien: {dataset[0]}")

