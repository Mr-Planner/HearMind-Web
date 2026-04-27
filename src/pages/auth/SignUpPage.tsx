import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { checkEmailRequest } from "../../service/authApi";
import { useAuthStore } from "../../store/auth/authStore";

const SignUpPage = () => {
  const navigate = useNavigate();
  const signup = useAuthStore((state) => state.signup);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordCheck, setPasswordCheck] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  
  const [isEmailChecked, setIsEmailChecked] = useState(false); // 중복 확인 여부

  const handleDuplicateCheck = async () => {
    if (!email.trim()) {
        alert("이메일을 입력해주세요.");
        return;
    }

    try {
        await checkEmailRequest(email);
        alert("사용 가능한 이메일입니다.");
        setIsEmailChecked(true);
    } catch (error: any) {
        alert(error.message);
        setIsEmailChecked(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isEmailChecked) {
        alert("이메일 중복 확인을 해주세요.");
        return;
    }

    if (!email.trim() || !password.trim() || !passwordCheck.trim() || !name.trim()) {
      alert("필수 입력값을 모두 입력해주세요.");
      return;
    }

    if (password !== passwordCheck) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      await signup(email, password, name, gender);
      alert("회원가입이 완료되었습니다. 로그인해주세요.");
      navigate("/login");
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <div className="h-full flex flex-col items-center pt-[25vh] bg-background px-4">

      <h1 className="text-4xl font-bold mb-10">HearMind</h1>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md flex flex-col gap-4"
      >
        <div className="flex items-center gap-2">
          <input
            type="email"
            placeholder="아이디 (이메일 형식 입력)"
            value={email}
            onChange={(e) => {
                setEmail(e.target.value);
                setIsEmailChecked(false); // 이메일 변경 시 중복 확인 초기화
            }}
            className="
              flex-1 border border-input rounded-2xl
              px-4 py-3 text-foreground text-base
              focus:outline-none focus:ring-2 focus:ring-ring focus:border-input
            "
          />

          <button
            type="button"
            onClick={handleDuplicateCheck}
            className="
              px-3 py-2 rounded-xl bg-primary
              text-primary-foreground text-sm font-medium
              hover:bg-primary/90 transition-colors
              cursor-pointer
            "
          >
            중복확인
          </button>
        </div>

        <input
          type="password"
          placeholder="비밀번호 (n자 이상 입력)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="
            w-full border border-input rounded-2xl
            px-4 py-3 text-foreground text-base
            focus:outline-none focus:ring-2 focus:ring-ring focus:border-input
          "
        />

        <input
          type="password"
          placeholder="비밀번호 확인"
          value={passwordCheck}
          onChange={(e) => setPasswordCheck(e.target.value)}
          className={`
            w-full border rounded-2xl
            px-4 py-3 text-foreground text-base
            focus:outline-none focus:ring-2 focus:ring-ring focus:border-input
            ${passwordCheck && (password !== passwordCheck) ? "border-destructive" : "border-input"}
          `}
        />
        {passwordCheck && (password !== passwordCheck) && (
          <p className="text-destructive text-sm px-2">비밀번호가 일치하지 않습니다.</p>
        )}

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="
              flex-1 border border-input rounded-2xl
              px-4 py-3 text-foreground text-base
              focus:outline-none focus:ring-2 focus:ring-ring focus:border-input
            "
          />

          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="
              w-28 border border-input rounded-2xl
              px-3 py-3 text-foreground text-base
              bg-background focus:outline-none
              focus:ring-2 focus:ring-ring focus:border-input
            "
          >
            <option value="">성별</option>
            <option value="M">남성</option>
            <option value="F">여성</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={!isEmailChecked}
          className="
            w-full mt-4
            bg-primary hover:bg-primary/90
            text-primary-foreground font-semibold text-base
            rounded-2xl py-3
            transition-colors duration-150
            cursor-pointer
            disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed disabled:hover:bg-muted
          "
        >
          회원가입
        </button>
      </form>
    </div>
  );
};

export default SignUpPage;
