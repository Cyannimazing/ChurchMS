# ChurchMS Setup Instructions

FIRST TO DO:

1.
git clone https://github.com/Cyannimazing/ChurchMS ChurchMS

2.
cd ChurchMS

3.
code .

BACKEND SETUP

1.
cd backend

2.
composer install

3.
cp .env.example .env

4.
php artisan key:generate

5.
php artisan migrate --seed

  if error

php artisan migrate:fresh --seed

7.
php artisan serve

ANOTHER TERMINAL  
SEPARATE TO THE BACKEND

FRONTEND SETUP

1.
cd frontend

2.
npm install

3.
cp .env.example .env 

4.
npm run dev

ADMIN USER:

'email' => 'admin@example.com'  
'password' => '123123123'

'email' => 'regular@example.com'  
'password' => '123123123'

'email' => 'owner@example.com'
'password' => '123123123'

'email' => 'staff@example.com'  
'password' => '123123123'
